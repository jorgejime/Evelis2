import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Store, Table, BarChart3, ArrowDownWideNarrow, Filter, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumSignificantDigits: 3 }).format(value);
};

// --- Helper Components for Matrices ---

const MatrixTable = ({
  title,
  rows,
  cols,
  data,
  rowKey,
  showTotal = true,
  filters = null,
  dateRange = null
}: any) => {
  const rowTotals = rows.map((r: string) => {
    return cols.reduce((acc: number, c: string) => acc + (data[r]?.[c] || 0), 0);
  });

  const colTotals = cols.map((c: string) => {
    return rows.reduce((acc: number, r: string) => acc + (data[r]?.[c] || 0), 0);
  });

  const grandTotal = rowTotals.reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
            {dateRange && (
              <p className="text-xs text-red-600 font-medium mt-1">CORTE AL: {dateRange}</p>
            )}
          </div>
          <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded border font-semibold">
            Total General: {grandTotal.toLocaleString()}
          </div>
        </div>
        {filters}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100">
            <tr>
              <th className="px-6 py-3 font-bold border-b sticky left-0 bg-slate-100 z-10">
                {rowKey}
              </th>
              {cols.map((col: string) => (
                <th key={col} className="px-4 py-3 font-semibold text-right border-b whitespace-nowrap">
                  {col}
                </th>
              ))}
              {showTotal && <th className="px-4 py-3 font-black text-right border-b bg-slate-200">TOTAL</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string, i: number) => (
              <tr key={row} className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900 border-r sticky left-0 bg-white hover:bg-slate-50 whitespace-nowrap">
                  {row}
                </td>
                {cols.map((col: string) => (
                  <td key={`${row}-${col}`} className="px-4 py-3 text-right text-slate-600 border-r border-dashed border-slate-100">
                    {data[row]?.[col] ? data[row][col].toLocaleString() : '-'}
                  </td>
                ))}
                {showTotal && (
                  <td className="px-4 py-3 font-bold text-right bg-slate-50">
                    {rowTotals[i].toLocaleString()}
                  </td>
                )}
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <td className="px-6 py-3 sticky left-0 bg-slate-100">TOTALES</td>
              {colTotals.map((total: number, i: number) => (
                <td key={i} className="px-4 py-3 text-right">
                  {total.toLocaleString()}
                </td>
              ))}
              {showTotal && <td className="px-4 py-3 text-right text-blue-700">{grandTotal.toLocaleString()}</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RankingTable = ({ title, storeMonthData, months }: any) => {
  const stores = Object.keys(storeMonthData);

  const monthlyRankings = months.map((month: string) => {
    const storeScores = stores.map(store => ({
      store,
      score: storeMonthData[store]?.[month] || 0
    })).sort((a, b) => b.score - a.score);

    const ranking: Record<string, number> = {};
    storeScores.forEach((item, index) => {
      ranking[item.store] = index + 1;
    });
    return ranking;
  });

  const cumulativePoints: Record<string, number[]> = {};
  stores.forEach(store => {
    cumulativePoints[store] = [];
    let cumulative = 0;
    monthlyRankings.forEach(ranking => {
      cumulative += ranking[store] || 999;
      cumulativePoints[store].push(cumulative);
    });
  });

  const finalRanking = stores.map(store => ({
    store,
    finalPoints: cumulativePoints[store][cumulativePoints[store].length - 1]
  })).sort((a, b) => a.finalPoints - b.finalPoints);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <Award className="w-5 h-5 text-yellow-600" />
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-blue-100 text-slate-800">
            <tr>
              <th className="px-4 py-2 text-left border-b sticky left-0 bg-blue-100 z-10 font-bold">Tienda</th>
              {months.map((month: string, idx: number) => (
                <React.Fragment key={month}>
                  <th className="px-2 py-2 text-center border-b font-semibold">
                    Rank<br/>{MONTHS_SHORT[idx]}
                  </th>
                </React.Fragment>
              ))}
              <th className="px-3 py-2 text-center border-b bg-red-100 font-black">PUNTOS<br/>ACUM.</th>
              <th className="px-3 py-2 text-center border-b bg-yellow-100 font-black">RANKING<br/>FINAL</th>
            </tr>
          </thead>
          <tbody>
            {finalRanking.map((item, finalRank) => {
              const store = item.store;
              const bgColor = finalRank === 0 ? 'bg-yellow-50' : finalRank === 1 ? 'bg-slate-50' : 'bg-white';
              return (
                <tr key={store} className={`${bgColor} border-b hover:bg-blue-50`}>
                  <td className={`px-4 py-2 font-medium text-slate-900 border-r sticky left-0 ${bgColor} z-10`}>
                    {store}
                  </td>
                  {monthlyRankings.map((ranking, mIdx) => (
                    <React.Fragment key={mIdx}>
                      <td className="px-2 py-2 text-center border-r">
                        {ranking[store] <= 3 ? (
                          <span className={`font-bold ${ranking[store] === 1 ? 'text-green-700' : ranking[store] === 2 ? 'text-blue-700' : 'text-orange-700'}`}>
                            {ranking[store]}
                          </span>
                        ) : ranking[store]}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="px-3 py-2 text-center font-bold bg-red-50 border-r">
                    {cumulativePoints[store][cumulativePoints[store].length - 1]}
                  </td>
                  <td className="px-3 py-2 text-center font-black text-lg bg-yellow-50">
                    {finalRank + 1}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { unifiedData } = useStore();
  const [activeTab, setActiveTab] = useState<'charts' | 'reports'>('charts');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // --- Get available categories and stores ---
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    unifiedData.forEach(d => cats.add(d.category));
    return Array.from(cats).sort();
  }, [unifiedData]);

  const availableStores = useMemo(() => {
    const stores = new Set<string>();
    unifiedData.forEach(d => stores.add(d.store));
    return Array.from(stores).sort();
  }, [unifiedData]);

  // --- Data Processing for Matrices ---
  const matrixData = useMemo(() => {
    if (unifiedData.length === 0) return null;

    let filtered = selectedYear === 'all'
      ? unifiedData
      : unifiedData.filter(d => d.date.startsWith(selectedYear));

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(d => selectedCategories.includes(d.category));
    }

    if (selectedMonths.length > 0) {
      filtered = filtered.filter(d => {
        const monthIdx = new Date(d.date).getMonth();
        return selectedMonths.includes(monthIdx);
      });
    }

    if (selectedStore !== 'all') {
      filtered = filtered.filter(d => d.store === selectedStore);
    }

    const storesSet = new Set<string>();
    const catsSet = new Set<string>();
    const storeCatMatrix: Record<string, Record<string, number>> = {};
    const storeMonthMatrix: Record<string, Record<string, number>> = {};
    const prodMonthMatrix: Record<string, Record<string, number>> = {};
    const storeProductMatrix: Record<string, Record<string, number>> = {};
    const prodsSet = new Set<string>();

    filtered.forEach(item => {
      if (!item.store || !item.date) return;

      const monthIdx = new Date(item.date).getMonth();
      if (isNaN(monthIdx)) return;

      const monthName = MONTHS[monthIdx];

      storesSet.add(item.store);
      catsSet.add(item.category);
      prodsSet.add(item.product);

      if (!storeCatMatrix[item.store]) storeCatMatrix[item.store] = {};
      storeCatMatrix[item.store][item.category] = (storeCatMatrix[item.store][item.category] || 0) + item.quantity;

      if (!storeMonthMatrix[item.store]) storeMonthMatrix[item.store] = {};
      storeMonthMatrix[item.store][monthName] = (storeMonthMatrix[item.store][monthName] || 0) + item.quantity;

      if (!prodMonthMatrix[item.product]) prodMonthMatrix[item.product] = {};
      prodMonthMatrix[item.product][monthName] = (prodMonthMatrix[item.product][monthName] || 0) + item.quantity;

      if (!storeProductMatrix[item.product]) storeProductMatrix[item.product] = {};
      storeProductMatrix[item.product][item.store] = (storeProductMatrix[item.product][item.store] || 0) + item.quantity;
    });

    const sortedStores = Array.from(storesSet).sort();
    const sortedCats = selectedCategories.length > 0 ? selectedCategories : Array.from(catsSet).sort();
    const sortedProds = Array.from(prodsSet).sort((a, b) => {
      const totalA = Object.values(prodMonthMatrix[a] || {}).reduce((x, y) => x + y, 0);
      const totalB = Object.values(prodMonthMatrix[b] || {}).reduce((x, y) => x + y, 0);
      return totalB - totalA;
    });

    return {
      storeCat: { rows: sortedStores, cols: sortedCats, data: storeCatMatrix },
      storeMonth: { rows: sortedStores, cols: MONTHS, data: storeMonthMatrix },
      prodMonth: { rows: sortedProds, cols: MONTHS, data: prodMonthMatrix },
      storeProduct: { rows: sortedProds, cols: sortedStores, data: storeProductMatrix },
    };

  }, [unifiedData, selectedYear, selectedCategories, selectedMonths, selectedStore]);


  // --- Standard Chart Data Logic (Existing) ---
  const kpis = useMemo(() => {
    const totalQty = unifiedData.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalRevenue = unifiedData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    
    const storeSales: Record<string, number> = {};
    unifiedData.forEach(d => { storeSales[d.store] = (storeSales[d.store] || 0) + d.quantity; });
    const topStore = Object.entries(storeSales).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    const prodSales: Record<string, number> = {};
    unifiedData.forEach(d => { prodSales[d.product] = (prodSales[d.product] || 0) + d.quantity; });
    const topProduct = Object.entries(prodSales).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    return { totalQty, totalRevenue, topStore, topProduct };
  }, [unifiedData]);

  const trendData = useMemo(() => {
    const grouped: Record<string, { name: string; '2025': number; '2026': number }> = {};
    unifiedData.forEach(d => {
        if (!d.date) return;
        const dateObj = new Date(d.date);
        if (isNaN(dateObj.getTime())) return;
        const monthKey = `${dateObj.getMonth() + 1}`.padStart(2, '0');
        const monthLabel = dateObj.toLocaleString('default', { month: 'short' });
        if (!grouped[monthKey]) grouped[monthKey] = { name: monthLabel, '2025': 0, '2026': 0 };
        if (d.source === '2025' || d.date.startsWith('2025')) grouped[monthKey]['2025'] += d.quantity;
        if (d.source === '2026' || d.date.startsWith('2026')) grouped[monthKey]['2026'] += d.quantity;
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).map(([_, val]) => val);
  }, [unifiedData]);

  const categoryMixData = useMemo(() => {
    const counts: Record<string, number> = {};
    unifiedData.forEach(d => { counts[d.category] = (counts[d.category] || 0) + d.quantity; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [unifiedData]);

  if (unifiedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
        <div className="p-4 bg-slate-50 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">No hay datos cargados. Por favor sube los archivos Excel arriba.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* KPI Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Ventas Totales (Und)</span>
                <ShoppingBag className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{kpis.totalQty.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Ventas Totales ($)</span>
                <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatMoney(kpis.totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Mejor Tienda</span>
                <Store className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-lg font-bold text-slate-800 truncate">{kpis.topStore[0]}</p>
            <p className="text-xs text-purple-600 font-medium">{kpis.topStore[1].toLocaleString()} Und</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Producto Top</span>
                <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-sm font-bold text-slate-800 line-clamp-2" title={kpis.topProduct[0]}>{kpis.topProduct[0]}</p>
            <p className="text-xs text-orange-600 font-medium mt-1">{kpis.topProduct[1].toLocaleString()} Und</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 p-1 bg-white rounded-lg border border-slate-200">
            <button 
                onClick={() => setActiveTab('charts')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'charts' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <BarChart3 className="w-4 h-4" />
                Gráficos
            </button>
            <button 
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Table className="w-4 h-4" />
                Reportes Detallados
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <label className="text-sm text-slate-500 font-medium">Año de Análisis:</label>
             <select 
               className="text-sm border-slate-200 border rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
               value={selectedYear}
               onChange={(e) => setSelectedYear(e.target.value)}
             >
               <option value="all">Todo el Periodo</option>
               <option value="2025">2025</option>
               <option value="2026">2026</option>
             </select>
          </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
             {/* Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 col-span-1 lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Comparativo Mensual (2025 vs 2026)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="2025" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* Category Mix */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Mix por Categoría</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryMixData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryMixData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             {/* Ranking Simple */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                <ArrowDownWideNarrow className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Para ver el Ranking Detallado</h3>
                <p className="text-slate-500 mb-4">Ve a la pestaña "Reportes Detallados"</p>
                <button onClick={() => setActiveTab('reports')} className="text-blue-600 font-medium hover:underline">Ir a Reportes &rarr;</button>
            </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-8">
            {matrixData && (
                <>
                    <MatrixTable
                        title="REPORTE DE VENTAS DE TABLEROS"
                        rows={matrixData.storeCat.rows}
                        cols={matrixData.storeCat.cols}
                        data={matrixData.storeCat.data}
                        rowKey="No."
                        dateRange={selectedYear === 'all' ? 'Todo el Periodo' : `31/12/${selectedYear}`}
                        filters={
                          <div className="flex gap-4 flex-wrap mt-3">
                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4 text-slate-500" />
                              <span className="text-xs font-medium text-slate-600">LÍNEA:</span>
                              <div className="flex gap-2">
                                {availableCategories.map(cat => (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      setSelectedCategories(prev =>
                                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                      );
                                    }}
                                    className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                                      selectedCategories.length === 0 || selectedCategories.includes(cat)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {selectedCategories.length > 0 && (
                              <button
                                onClick={() => setSelectedCategories([])}
                                className="text-xs text-red-600 hover:underline font-medium"
                              >
                                Limpiar Filtros
                              </button>
                            )}
                          </div>
                        }
                    />

                    <MatrixTable
                        title="VENTA DE TABLEROS POR MESES"
                        rows={matrixData.storeMonth.rows}
                        cols={matrixData.storeMonth.cols}
                        data={matrixData.storeMonth.data}
                        rowKey="Tienda"
                        dateRange={`12 de Diciembre ${selectedYear === 'all' ? '' : selectedYear}`}
                    />

                    <RankingTable
                        title="RANKING DE POSICION DE LAS TIENDAS MES A MES Y ACUMULADO"
                        storeMonthData={matrixData.storeMonth.data}
                        months={matrixData.storeMonth.cols}
                    />

                    <MatrixTable
                        title={`VENTA DETALLA POR COLOR Y TIENDA ${selectedYear === 'all' ? '' : selectedYear}`}
                        rows={matrixData.storeProduct.rows}
                        cols={matrixData.storeProduct.cols}
                        data={matrixData.storeProduct.data}
                        rowKey="Producto / Color"
                        filters={
                          <div className="flex gap-4 items-center mt-3">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-medium text-slate-600">Filtrar por Tienda:</span>
                            <select
                              value={selectedStore}
                              onChange={(e) => setSelectedStore(e.target.value)}
                              className="text-xs border-slate-300 border rounded px-2 py-1"
                            >
                              <option value="all">Todas las Tiendas</option>
                              {availableStores.map(store => (
                                <option key={store} value={store}>{store}</option>
                              ))}
                            </select>
                          </div>
                        }
                    />

                    <MatrixTable
                        title={`VENTAS POR COLOR - AÑO ${selectedYear === 'all' ? 'TODO' : selectedYear}`}
                        rows={matrixData.prodMonth.rows}
                        cols={matrixData.prodMonth.cols}
                        data={matrixData.prodMonth.data}
                        rowKey="Producto / Color"
                        filters={
                          <div className="flex gap-4 flex-wrap mt-3">
                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4 text-slate-500" />
                              <span className="text-xs font-medium text-slate-600">LÍNEA:</span>
                              <div className="flex gap-2">
                                {availableCategories.map(cat => (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      setSelectedCategories(prev =>
                                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                      );
                                    }}
                                    className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                                      selectedCategories.length === 0 || selectedCategories.includes(cat)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        }
                    />
                </>
            )}
        </div>
      )}
    </div>
  );
};
