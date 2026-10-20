
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getAuditLogs,
} from '../services/users'

const PAGE_SIZE = 10

function AuditLogs() {
  const [page, setPage] = useState(1)

  const {
    data: fetchedLogs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () =>
      getAuditLogs(
        (page - 1) * PAGE_SIZE,
        PAGE_SIZE + 1,
      ),
  })

  const logs = fetchedLogs.slice(0, PAGE_SIZE)
  const hasNextPage = fetchedLogs.length > PAGE_SIZE

  return (
    <div className="users-page audit-logs-page">
      <div className="page-header">
        <h1>Audit Log</h1>
        <p>
          Review administrative actions performed in the system.
        </p>
      </div>

      <div className="users-table-container">
        {isLoading ? (
          <p className="users-loading">
            Loading audit history...
          </p>
        ) : isError ? (
          <p className="error-message" role="alert">
            Failed to load audit history. Please try again.
          </p>
        ) : logs.length === 0 ? (
          <div className="users-empty-state">
            <h3>No audit events found</h3>
            <p>
              Administrative actions will appear here when recorded.
            </p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target user</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {new Date(
                      log.created_at,
                    ).toLocaleString()}
                  </td>

                  <td>{log.actor_email}</td>

                  <td>
                    <span className="audit-action">
                      {log.action.replaceAll('_', ' ')}
                    </span>
                  </td>

                  <td>
                    {log.target_email ??
                      (log.target_user_id !== null
                        ? `User #${log.target_user_id}`
                        : '—')}
                  </td>

                  <td>{log.details ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !isError && fetchedLogs.length > 0 && (
        <div className="users-pagination">
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.max(1, current - 1))
            }
            disabled={page === 1}
          >
            Previous
          </button>

          <span>Page {page}</span>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AuditLogs
