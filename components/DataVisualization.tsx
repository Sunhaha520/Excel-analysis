'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from 'recharts'
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Zap as ScatterIcon, Settings, Edit2, Plus, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface DataVisualizationProps {
  data: any
  fileType: 'excel' | 'json'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0']

export default function DataVisualization({ data, fileType }: DataVisualizationProps) {
  const { theme } = useTheme()
  const [chartType, setChartType] = useState('bar')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [xAxisColumn, setXAxisColumn] = useState('')
  const [yAxisColumns, setYAxisColumns] = useState<string[]>([])
  const [xAxisLabel, setXAxisLabel] = useState('')
  const [yAxisLabel, setYAxisLabel] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [groupByColumn, setGroupByColumn] = useState('')
  const [showPercentage, setShowPercentage] = useState(false)

  const processedData = useMemo(() => {
    if (!data || !data.rows) return { chartData: [], numericColumns: [], textColumns: [], allColumns: [] }

    const { headers, rows } = data
    const numericColumns: string[] = []
    const textColumns: string[] = []
    const allColumns: string[] = headers

    // 分析列类型
    headers.forEach((header: string, index: number) => {
      const sampleValues = rows.slice(0, 10).map((row: any) => 
        Array.isArray(row) ? row[index] : row[header]
      ).filter((val: any) => val !== null && val !== undefined && val !== '')

      const numericValues = sampleValues.filter((val: any) => !isNaN(Number(val)) && val !== '')
      const isNumeric = numericValues.length > sampleValues.length * 0.7

      if (isNumeric) {
        numericColumns.push(header)
      } else {
        textColumns.push(header)
      }
    })

    // 初始化默认选择
    if (!xAxisColumn && (textColumns.length > 0 || allColumns.length > 0)) {
      const defaultX = textColumns[0] || allColumns[0]
      setXAxisColumn(defaultX)
      setXAxisLabel(defaultX)
    }
    if (yAxisColumns.length === 0 && numericColumns.length > 0) {
      setYAxisColumns([numericColumns[0]])
      setYAxisLabel(numericColumns[0])
    }

    // 生成图表数据
    let chartData: any[] = []
    
    if (xAxisColumn && yAxisColumns.length > 0) {
      const xIndex = headers.indexOf(xAxisColumn)
      
      if (groupByColumn && groupByColumn !== xAxisColumn) {
        // 分组数据处理
        const groupIndex = headers.indexOf(groupByColumn)
        const groupedData: { [xKey: string]: { [groupKey: string]: { [yCol: string]: number[] } } } = {}
        
        rows.forEach((row: any) => {
          const xValue = Array.isArray(row) ? row[xIndex] : row[xAxisColumn]
          const groupValue = Array.isArray(row) ? row[groupIndex] : row[groupByColumn]
          const xKey = xValue?.toString() || 'Unknown'
          const groupKey = groupValue?.toString() || 'Unknown'
          
          if (!groupedData[xKey]) groupedData[xKey] = {}
          if (!groupedData[xKey][groupKey]) groupedData[xKey][groupKey] = {}
          
          yAxisColumns.forEach((yCol: string) => {
            const yIndex = headers.indexOf(yCol)
            const yValue = Array.isArray(row) ? row[yIndex] : (row as Record<string, any>)[yCol]
            if (!groupedData[xKey][groupKey][yCol]) groupedData[xKey][groupKey][yCol] = []
            groupedData[xKey][groupKey][yCol].push(Number(yValue) || 0)
          })
        })
        
        chartData = Object.entries(groupedData).map(([xKey, groups]) => {
          const item: any = { name: xKey }
          Object.entries(groups).forEach(([groupKey, values]) => {
            yAxisColumns.forEach((yCol: string) => {
              const arr = (values as Record<string, number[]>)[yCol] || []
              const sum = arr.reduce((a: number, b: number) => a + b, 0)
              const avg = arr.length ? sum / arr.length : 0
              item[`${groupKey}_${yCol}`] = avg
            })
          })
          return item
        }).slice(0, 50)
      } else {
        // 单变量或多变量数据处理
        const aggregatedData: { [key: string]: { count: number, values: { [key: string]: number[] } } } = {}
        
        rows.forEach((row: any) => {
          const xValue = Array.isArray(row) ? row[xIndex] : row[xAxisColumn]
          const xKey = xValue?.toString() || 'Unknown'
          
          if (!aggregatedData[xKey]) {
            aggregatedData[xKey] = { count: 0, values: {} }
            yAxisColumns.forEach(yCol => {
              aggregatedData[xKey].values[yCol] = []
            })
          }
          
          aggregatedData[xKey].count++
          yAxisColumns.forEach(yCol => {
            const yIndex = headers.indexOf(yCol)
            const yValue = Array.isArray(row) ? row[yIndex] : row[yCol]
            aggregatedData[xKey].values[yCol].push(Number(yValue) || 0)
          })
        })
        
        chartData = Object.entries(aggregatedData).map(([xKey, data]) => {
          const item: any = { name: xKey, count: data.count }
          
          yAxisColumns.forEach(yCol => {
            const values = data.values[yCol]
            const sum = values.reduce((a, b) => a + b, 0)
            const avg = values.length ? sum / values.length : 0
            item[yCol] = avg
            item[`${yCol}_sum`] = sum
            item[`${yCol}_count`] = values.length
          })
          
          return item
        }).slice(0, 50)
        
        // 计算百分比
        if (showPercentage && chartData.length > 0) {
          yAxisColumns.forEach(yCol => {
            const total = chartData.reduce((sum, item) => sum + (item[`${yCol}_sum`] || item[yCol] || 0), 0)
            chartData.forEach(item => {
              const value = item[`${yCol}_sum`] || item[yCol] || 0
              item[`${yCol}_percentage`] = total > 0 ? (value / total * 100) : 0
            })
          })
        }
      }
    }

    return { chartData, numericColumns, textColumns, allColumns }
  }, [data, xAxisColumn, yAxisColumns, groupByColumn, showPercentage])

  // 饼图数据处理
  const pieData = useMemo(() => {
    if (!processedData.chartData.length || yAxisColumns.length === 0) return []
    
    const yCol = yAxisColumns[0]
    const dataKey = showPercentage ? `${yCol}_percentage` : yCol
    
    return processedData.chartData
      .map(item => ({
        name: item.name,
        value: item[dataKey] || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [processedData.chartData, yAxisColumns, showPercentage])

  const addYAxisColumn = (column: string) => {
    if (!yAxisColumns.includes(column)) {
      setYAxisColumns([...yAxisColumns, column])
    }
  }

  const removeYAxisColumn = (column: string) => {
    setYAxisColumns(yAxisColumns.filter(col => col !== column))
  }

  const renderChart = () => {
    const { chartData } = processedData
    const isDark = theme === 'dark'

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p>暂无数据或请选择有效的X轴和Y轴列</p>
            <p className="text-sm mt-2">请在设置中选择要可视化的数据列</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      width: '100%',
      height: 400
    }

    const tooltipStyle = {
      backgroundColor: isDark ? '#374151' : '#ffffff',
      border: `1px solid ${isDark ? '#4B5563' : '#e5e7eb'}`,
      borderRadius: '8px',
      color: isDark ? '#f9fafb' : '#111827'
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {yAxisColumns.map((yCol, index) => (
                <Bar 
                  key={yCol}
                  dataKey={showPercentage ? `${yCol}_percentage` : yCol}
                  fill={COLORS[index % COLORS.length]}
                  name={`${yCol}${showPercentage ? ' (%)' : ''}`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e5e7eb'} />
              <XAxis 
                dataKey="name"
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {yAxisColumns.map((yCol, index) => (
                <Line 
                  key={yCol}
                  type="monotone" 
                  dataKey={showPercentage ? `${yCol}_percentage` : yCol}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={`${yCol}${showPercentage ? ' (%)' : ''}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e5e7eb'} />
              <XAxis 
                dataKey="name"
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <YAxis 
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {yAxisColumns.map((yCol, index) => (
                <Area 
                  key={yCol}
                  type="monotone" 
                  dataKey={showPercentage ? `${yCol}_percentage` : yCol}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                  name={`${yCol}${showPercentage ? ' (%)' : ''}`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )
      
      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={chartData}>
              <CartesianGrid stroke={isDark ? '#4B5563' : '#e5e7eb'} />
              <XAxis 
                dataKey="name"
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {yAxisColumns.map((yCol, index) => (
                <Scatter 
                  key={yCol}
                  dataKey={showPercentage ? `${yCol}_percentage` : yCol}
                  fill={COLORS[index % COLORS.length]}
                  name={`${yCol}${showPercentage ? ' (%)' : ''}`}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">数据可视化</h3>
            <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>图表设置</span>
            </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">图表配置</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* X轴选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                X轴数据列
              </label>
              <select
                value={xAxisColumn}
                onChange={(e) => setXAxisColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">请选择X轴列</option>
                {processedData.allColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* 分组列选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                分组列 (可选)
              </label>
              <select
                value={groupByColumn}
                onChange={(e) => setGroupByColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">无分组</option>
                {processedData.textColumns.filter(col => col !== xAxisColumn).map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Y轴多选 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Y轴数据列 (多选)
          </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {yAxisColumns.map(col => (
                <span 
                  key={col}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {col}
                  <button
                    onClick={() => removeYAxisColumn(col)}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <select
                  onChange={(e) => {
                if (e.target.value) {
                  addYAxisColumn(e.target.value)
                  e.target.value = ''
                }
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">点击添加Y轴列</option>
              {processedData.numericColumns.filter(col => !yAxisColumns.includes(col)).map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* X轴标签重命名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Edit2 className="w-4 h-4 inline mr-1" />
                X轴标签名称
              </label>
              <input
                type="text"
                value={xAxisLabel}
                onChange={(e) => setXAxisLabel(e.target.value)}
                placeholder="输入X轴标签名称"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Y轴标签重命名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Edit2 className="w-4 h-4 inline mr-1" />
                Y轴标签名称
              </label>
              <input
                type="text"
                value={yAxisLabel}
                onChange={(e) => setYAxisLabel(e.target.value)}
                placeholder="输入Y轴标签名称"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* 显示选项 */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showPercentage}
                onChange={(e) => setShowPercentage(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">显示百分比</span>
            </label>
          </div>
        </div>
      )}

      {/* 图表类型选择 */}
      <div className="flex space-x-2 mb-6">
        {[
          { type: 'bar', name: '柱状图', icon: BarChart3 },
          { type: 'line', name: '折线图', icon: LineChartIcon },
          { type: 'area', name: '面积图', icon: LineChartIcon },
          { type: 'pie', name: '饼图', icon: PieChartIcon },
          { type: 'scatter', name: '散点图', icon: ScatterIcon },
        ].map(({ type, name, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              chartType === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{name}</span>
          </button>
        ))}
      </div>

      {/* 图表渲染区域 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
        {renderChart()}
      </div>

      {/* 数据信息 */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          当前显示: {processedData.chartData.length} 条数据
          {xAxisColumn && yAxisColumns.length > 0 && (
            <span> | X轴: {xAxisLabel || xAxisColumn} | Y轴: {yAxisColumns.join(', ')}</span>
          )}
          {groupByColumn && <span> | 分组: {groupByColumn}</span>}
          {showPercentage && <span> | 显示百分比</span>}
        </p>
      </div>
    </div>
  )
} 