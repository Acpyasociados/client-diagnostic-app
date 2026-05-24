/**
 * Audit logging utilities for ACP Diagnostic System
 * Provides persistent audit trail for all important actions
 */

import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

/**
 * Hash the admin token (SHA256) for audit logging
 * Never store the full token in logs
 */
function hashToken(token) {
  if (!token) return 'unknown';
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
}

/**
 * Log an audit event to persistent storage
 *
 * Input: {
 *   action: 'case_note_created|case_viewed|payment_received|access_denied',
 *   case_id: 'ACP-123',
 *   advisor_token: 'full_token_here',  // Will be hashed
 *   ip_address: '192.168.1.1',
 *   user_agent: 'Mozilla/5.0...',
 *   details: { old_value: 'X', new_value: 'Y' },
 *   success: true,
 *   error_message: null
 * }
 */
export async function logAuditEvent(event) {
  try {
    const auditStore = getStore('audit-logs');

    // Create audit record
    const auditRecord = {
      timestamp: new Date().toISOString(),
      action: event.action || 'unknown',
      case_id: event.case_id || null,
      advisor_token_hash: hashToken(event.advisor_token),
      ip_address: event.ip_address || 'unknown',
      user_agent: event.user_agent || 'unknown',
      details: event.details || {},
      success: event.success !== false,
      error_message: event.error_message || null
    };

    // Generate unique key: timestamp + uuid-like
    const key = `${auditRecord.timestamp}-${crypto.randomBytes(4).toString('hex')}`;

    // Write to audit logs store
    await auditStore.set(key, JSON.stringify(auditRecord));

    console.log('✓ Audit logged:', {
      action: event.action,
      case_id: event.case_id,
      timestamp: auditRecord.timestamp
    });

    return { success: true, key };

  } catch (error) {
    console.error('✗ Error logging audit event:', error.message);
    // Don't throw - audit failures shouldn't break the main operation
    return { success: false, error: error.message };
  }
}

/**
 * Retrieve audit logs with optional filtering
 *
 * Filters: {
 *   case_id: 'ACP-123',      // Filter by case
 *   action: 'case_note_created',  // Filter by action
 *   date_from: '2026-05-23',   // Filter by date range
 *   date_to: '2026-05-24',
 *   limit: 50,                // Max results
 *   offset: 0                 // Pagination
 * }
 */
export async function getAuditLog(filters = {}) {
  try {
    const auditStore = getStore('audit-logs');
    const logs = [];

    // Get all audit logs from store
    const { blobs } = await auditStore.list();

    for (const blob of blobs) {
      const data = await auditStore.get(blob.key);
      if (data) {
        try {
          logs.push(JSON.parse(data));
        } catch (e) {
          console.error('Error parsing audit log:', blob.key);
        }
      }
    }

    // Apply filters
    let filtered = logs;

    // Filter by case_id
    if (filters.case_id) {
      filtered = filtered.filter(log => log.case_id === filters.case_id);
    }

    // Filter by action
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Filter by date range
    if (filters.date_from) {
      const from = new Date(filters.date_from).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= from);
    }

    if (filters.date_to) {
      const to = new Date(filters.date_to).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() <= to);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit and offset for pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      success: true,
      total: filtered.length,
      limit,
      offset,
      logs: paginated
    };

  } catch (error) {
    console.error('Error retrieving audit logs:', error.message);
    return {
      success: false,
      error: error.message,
      logs: []
    };
  }
}

/**
 * Get summary statistics for audit logs
 * Returns counts by action, case, etc.
 */
export async function getAuditStats(dateRange = null) {
  try {
    const logs = await getAuditLog();

    if (!logs.success) {
      return { success: false, error: logs.error };
    }

    const stats = {
      total_events: logs.logs.length,
      by_action: {},
      by_case: {},
      by_success: { success: 0, failed: 0 },
      date_range: {
        earliest: null,
        latest: null
      }
    };

    // Calculate statistics
    for (const log of logs.logs) {
      // By action
      stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;

      // By case
      if (log.case_id) {
        stats.by_case[log.case_id] = (stats.by_case[log.case_id] || 0) + 1;
      }

      // By success
      if (log.success) {
        stats.by_success.success++;
      } else {
        stats.by_success.failed++;
      }

      // Date range
      const timestamp = new Date(log.timestamp);
      if (!stats.date_range.earliest || timestamp < new Date(stats.date_range.earliest)) {
        stats.date_range.earliest = log.timestamp;
      }
      if (!stats.date_range.latest || timestamp > new Date(stats.date_range.latest)) {
        stats.date_range.latest = log.timestamp;
      }
    }

    return { success: true, stats };

  } catch (error) {
    console.error('Error calculating audit stats:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Clear old audit logs (older than X days)
 * Use cautiously - this deletes data
 */
export async function clearOldAuditLogs(daysOld = 90) {
  try {
    const auditStore = getStore('audit-logs');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    const { blobs } = await auditStore.list();

    for (const blob of blobs) {
      const data = await auditStore.get(blob.key);
      if (data) {
        try {
          const log = JSON.parse(data);
          if (new Date(log.timestamp) < cutoffDate) {
            // Delete by setting empty (Blobs doesn't have delete, so set empty marker)
            await auditStore.set(blob.key, JSON.stringify({ _deleted: true, deleted_at: new Date().toISOString() }));
            deletedCount++;
          }
        } catch (e) {
          console.error('Error processing log:', blob.key);
        }
      }
    }

    console.log(`Cleared ${deletedCount} audit logs older than ${daysOld} days`);
    return { success: true, deleted: deletedCount };

  } catch (error) {
    console.error('Error clearing audit logs:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Export audit logs for compliance/archiving
 * Returns all logs for a case or action
 */
export async function exportAuditLogs(filters = {}) {
  try {
    const result = await getAuditLog({
      ...filters,
      limit: 10000  // Allow large exports
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Convert to CSV format for export
    const csv = convertLogsToCSV(result.logs);

    return {
      success: true,
      count: result.logs.length,
      csv,
      json: result.logs
    };

  } catch (error) {
    console.error('Error exporting audit logs:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Convert audit logs to CSV format
 */
function convertLogsToCSV(logs) {
  if (!logs || logs.length === 0) {
    return 'No audit logs to export\n';
  }

  // Headers
  const headers = [
    'Timestamp',
    'Action',
    'Case ID',
    'Advisor Token Hash',
    'IP Address',
    'Success',
    'Error Message',
    'Details'
  ];

  // Rows
  const rows = logs.map(log => [
    log.timestamp,
    log.action,
    log.case_id || '-',
    log.advisor_token_hash,
    log.ip_address,
    log.success ? 'Yes' : 'No',
    log.error_message || '-',
    JSON.stringify(log.details).replace(/"/g, '""')
  ]);

  // Build CSV
  const headerLine = headers.map(h => `"${h}"`).join(',');
  const rowLines = rows.map(r => r.map(cell => `"${cell}"`).join(','));

  return [headerLine, ...rowLines].join('\n');
}
