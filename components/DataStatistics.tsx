'use client'

import { useMemo } from 'react'
import { BarChart, Users, Calculator, TrendingUp } from 'lucide-react'

interface DataStatisticsProps {
  data: any
  fileType: 'excel' | 'json'
}

export default function DataStatistics({ data, fileType }: DataStatisticsProps) {
  // 辅助函数
  const getMedian = (arr: number[]) => {
    const mid = Math.floor(arr.length / 2)
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
  }

  const getMode = (arr: number[]) => {
    const frequency: any = {}
    arr.forEach(val => frequency[val] = (frequency[val] || 0) + 1)
    const maxFreq = Math.max(...Object.values(frequency) as number[])
    return Object.keys(frequency).find(key => frequency[key] === maxFreq)
  }

  const getStandardDeviation = (arr: number[]) => {
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length
    return Math.sqrt(variance)
  }

  const statistics = useMemo(() => {
    if (!data || !data.rows) return null

    const { headers, rows } = data
    const numericColumns: any = {}
    const textColumns: any = {}
    const columnTypes: any = {}

    // 分析每列的数据类型和统计信息
    headers.forEach((header: string, index: number) => {
      const values = rows.map((row: any) => 
        Array.isArray(row) ? row[index] : row[header]
      ).filter((val: any) => val !== null && val !== undefined && val !== '')

      if (values.length === 0) return

      // 判断数据类型
      const numericValues = values.filter((val: any) => !isNaN(Number(val)) && val !== '')
      const isNumeric = numericValues.length > values.length * 0.7

      if (isNumeric) {
        const numbers = numericValues.map((val: any) => Number(val))
        columnTypes[header] = 'numeric'
        numericColumns[header] = {
          count: numbers.length,
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          sum: numbers.reduce((acc: number, val: number) => acc + val, 0),
          mean: numbers.reduce((acc: number, val: number) => acc + val, 0) / numbers.length,
          median: getMedian(numbers.sort((a: number, b: number) => a - b)),
          mode: getMode(numbers),
          std: getStandardDeviation(numbers)
        }
      } else {
        columnTypes[header] = 'text'
        const frequency: any = {}
        values.forEach((val: any) => {
          const str = val.toString()
          frequency[str] = (frequency[str] || 0) + 1
        })

        textColumns[header] = {
          count: values.length,
          unique: Object.keys(frequency).length,
          mostCommon: Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
          ),
          frequency
        }
      }
    })

    return {
      totalRows: rows.length,
      totalColumns: headers.length,
      numericColumns,
      textColumns,
      columnTypes
    }
  }, [data])

  if (!statistics) return null

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">统计分析</h3>
      
      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">总行数</p>
              <p className="text-2xl font-bold">{statistics.totalRows.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">总列数</p>
              <p className="text-2xl font-bold">{statistics.totalColumns}</p>
            </div>
            <BarChart className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">数值列</p>
              <p className="text-2xl font-bold">{Object.keys(statistics.numericColumns).length}</p>
            </div>
            <Calculator className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">文本列</p>
              <p className="text-2xl font-bold">{Object.keys(statistics.textColumns).length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* 数值列统计 */}
      {Object.keys(statistics.numericColumns).length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">数值列详细统计</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">列名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">计数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">最小值</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">最大值</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均值</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">中位数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标准差</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(statistics.numericColumns).map(([column, stats]: [string, any]) => (
                  <tr key={column} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{column}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stats.count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stats.min.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stats.max.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stats.mean.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stats.median.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stats.std.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 文本列统计 */}
      {Object.keys(statistics.textColumns).length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">文本列详细统计</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(statistics.textColumns).map(([column, stats]: [string, any]) => (
              <div key={column} className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">{column}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">总计数:</span>
                    <span className="font-medium">{stats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">唯一值:</span>
                    <span className="font-medium">{stats.unique}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最常见:</span>
                    <span className="font-medium text-blue-600 truncate" title={stats.mostCommon}>
                      {stats.mostCommon}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 