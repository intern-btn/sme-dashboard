'use client'

import { useState, useEffect, useCallback } from 'react'

export function useDataFetch(dataType, refreshInterval = null) {
  const [data, setData] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noData, setNoData] = useState(false)

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true)

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
        // Timeout - retry up to 3 times
        if (retryCount < 3) {
          console.log(`Timeout on ${dataType}, retrying (${retryCount + 1}/3)...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return fetchData(retryCount + 1)
        } else {
          setError('Connection slow - please refresh manually')
        }
      } else if (dataResponse.status === 404 || dataResponse.status === 503) {
        // No data uploaded yet
        setNoData(true)
        setError(null)
      } else {
        throw new Error('Failed to fetch data')
      }

    } catch (err) {
      console.error(`Error fetching ${dataType}:`, err)
      setError(err.message)
      setNoData(true)
    } finally {
      setLoading(false)
    }
  }, [dataType])

  useEffect(() => {
    // Fetch immediately on mount
    fetchData()

    // Set up interval if refreshInterval is specified
    if (refreshInterval) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, metadata, loading, error, noData, refresh }
}
