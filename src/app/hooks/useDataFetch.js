'use client'

import { useState, useEffect, useCallback } from 'react'

export function useDataFetch(dataType, refreshInterval = 30000) {
  const [data, setData] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noData, setNoData] = useState(false)

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      // Fetch metadata
      const metaResponse = await fetch(`/api/data/${dataType}/metadata`)
      if (metaResponse.ok) {
        const meta = await metaResponse.json()
        if (!meta.error) {
          setMetadata(meta)
        }
      }

      // Fetch parsed data
      const dataResponse = await fetch(`/api/data/${dataType}/parsed`)
      if (dataResponse.ok) {
        const parsedData = await dataResponse.json()
        if (!parsedData.error) {
          setData(parsedData)
          setNoData(false)
          setError(null)
        } else {
          setNoData(true)
        }
      } else if (dataResponse.status === 504) {
        // Timeout - retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          console.log(`Timeout on ${dataType}, retrying (${retryCount + 1}/3)...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return fetchData(retryCount + 1)
        } else {
          // After 3 retries, only show error if we don't have cached data
          if (!data) {
            setNoData(true)
          }
          setError('Connection slow - retrying...')
        }
      } else if (dataResponse.status === 404) {
        // No data uploaded yet
        setNoData(true)
        setError(null)
      } else {
        throw new Error('Failed to fetch data')
      }

    } catch (err) {
      // Only set error for actual failures, not missing data
      if (err.message !== 'Failed to fetch data') {
        setError(err.message)
      }
      // Don't set noData if we already have cached data
      if (!data) {
        setNoData(true)
      }
    } finally {
      setLoading(false)
    }
  }, [dataType, data])

  useEffect(() => {
    // Fetch immediately
    fetchData()

    // Then every X seconds
    const interval = setInterval(fetchData, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchData, refreshInterval])

  return { data, metadata, loading, error, noData }
}
