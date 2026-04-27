import { h } from 'https://esm.sh/preact@10.19.2';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact@10.19.2/hooks';
import { formatINR } from '../util.js';
import { calculateIncomeTax } from '../finance.js';

const IncomeTaxCalculator = () => {
    // State for inputs
    const [grossIncome, setGrossIncome] = useState(1200000);
    const [sec80C, setSec80C] = useState(150000);
    const [hra, setHra] = useState(60000);
    const [nps, setNps] = useState(50000);
    const [otherDed, setOtherDed] = useState(0);
    const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');

    // Load from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('gi')) setGrossIncome(Number(params.get('gi')));
        if (params.has('c80')) setSec80C(Number(params.get('c80')));
        if (params.has('hra')) setHra(Number(params.get('hra')));
        if (params.has('nps')) setNps(Number(params.get('nps')));
        if (params.has('oth')) setOtherDed(Number(params.get('oth')));

        // Theme observer
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.dataset.theme || 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams();
        params.set('gi', grossIncome);
        params.set('c80', sec80C);
        params.set('hra', hra);
        params.set('nps', nps);
        params.set('oth', otherDed);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }, [grossIncome, sec80C, hra, nps, otherDed]);

    // Calculations
    const results = useMemo(() => {
        return calculateIncomeTax(grossIncome, { 
            section80C: sec80C, 
            hra, 
            nps, 
            otherDeductions: otherDed 
        });
    }, [grossIncome, sec80C, hra, nps, otherDed]);

    // Chart Effect
    useEffect(() => {
        if (!results) return;
        const ctx = document.getElementById('taxBarChart')?.getContext('2d');
        if (!ctx) return;

        const isDark = theme === 'dark';
        
        if (window.chartInstance) {
            window.chartInstance.destroy();
        }

        window.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Old Regime', 'New Regime'],
                datasets: [{
                    label: 'Annual Tax',
                    data: [results.oldRegimeTax, results.newRegimeTax],
                    backgroundColor: [
                        results.recommendation === 'old' ? 'rgba(13,148,136,0.85)' : 'rgba(8,145,178,0.75)',
                        results.recommendation === 'new' ? 'rgba(13,148,136,0.85)' : 'rgba(8,145,178,0.75)',
                    ],
                    borderColor: [
                        results.recommendation === 'old' ? 'rgba(13,148,136,1)' : 'rgba(8,145,178,1)',
                        results.recommendation === 'new' ? 'rgba(13,148,136,1)' : 'rgba(8,145,178,1)',
                    ],
                    borderWidth: 1.5,
                    borderRadius: 10,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => ` Annual Tax: ${formatINR(c.raw)}` } }
                },
                scales: {
                    x: { 
                        ticks: { color: isDark ? '#a8a29e' : '#57534e', font: { size: 14, weight: '600' } },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { 
                            color: isDark ? '#a8a29e' : '#57534e', 
                            font: { size: 12 },
                            callback: v => v >= 1e5 ? `₹${(v / 1e5).toFixed(0)}L` : `₹${v}`
                        },
                        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                    }
                },
                animation: { duration: 500 }
            }
        });

        return () => {
            if (window.chartInstance) {
                window.chartInstance.destroy();
                window.chartInstance = null;
            }
        };
    }, [results, theme]);

    const handleReset = () => {
        setGrossIncome(1200000);
        setSec80C(150000);
        setHra(60000);
        setNps(50000);
        setOtherDed(0);
    };

    const lakhFmt = v => { 
        const L = v / 100000; 
        return L >= 100 ? `₹${(v / 10000000).toFixed(1)}Cr` : L >= 1 ? `₹${L.toFixed(1)}L` : `₹${Number(v).toLocaleString('en-IN')}`; 
    };

    const oldSlabs = [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 500000, rate: 5 },
        { from: 500000, to: 1000000, rate: 20 },
        { from: 1000000, to: Infinity, rate: 30 },
    ];

    const newSlabs = [
        { from: 0, to: 400000, rate: 0 },
        { from: 400000, to: 800000, rate: 5 },
        { from: 800000, to: 1200000, rate: 10 },
        { from: 1200000, to: 1600000, rate: 15 },
        { from: 1600000, to: 2000000, rate: 20 },
        { from: 2000000, to: Infinity, rate: 30 },
    ];

    const calculateSlabBreakdown = (income, slabs) => {
        return slabs.map(slab => {
            if (income <= slab.from) return { ...slab, tax: 0, taxableInSlab: 0 };
            const taxableInSlab = Math.min(income, slab.to) - slab.from;
            const tax = (taxableInSlab * slab.rate) / 100;
            return { ...slab, tax, taxableInSlab };
        });
    };

    const oldBreakdown = useMemo(() => calculateSlabBreakdown(results.oldTaxableIncome, oldSlabs), [results.oldTaxableIncome]);
    const newBreakdown = useMemo(() => calculateSlabBreakdown(results.newTaxableIncome, newSlabs), [results.newTaxableIncome]);

    return h('div', { class: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24' }, [
        h('section', { class: 'card p-6 md:p-8 mb-8' }, [
            h('h3', { class: 'text-lg font-bold mb-6' }, 'Income & Deductions'),
            h('div', { class: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' }, [
                // Gross Income
                h('div', null, [
                    h('label', { for: 'grossIncome', class: 'label-text flex items-center mb-1' }, [
                        'Gross Annual Income (₹)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'Total CTC or annual income before tax')
                        ])
                    ]),
                    h('input', {
                        id: 'grossIncome',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '0',
                        step: '10000',
                        value: grossIncome,
                        onInput: (e) => setGrossIncome(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '200000',
                            max: '5000000',
                            step: '50000',
                            value: grossIncome,
                            onInput: (e) => setGrossIncome(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${((grossIncome - 200000) / (5000000 - 200000)) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${((grossIncome - 200000) / (5000000 - 200000)) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, lakhFmt(grossIncome))
                    ])
                ]),
                // 80C
                h('div', null, [
                    h('label', { for: 'sec80C', class: 'label-text flex items-center mb-1' }, [
                        'Section 80C Investments (₹)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'ELSS, PPF, LIC, EPF – max ₹1.5L allowed')
                        ])
                    ]),
                    h('input', {
                        id: 'sec80C',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '0',
                        max: '150000',
                        step: '5000',
                        value: sec80C,
                        onInput: (e) => setSec80C(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '0',
                            max: '150000',
                            step: '5000',
                            value: sec80C,
                            onInput: (e) => setSec80C(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${(sec80C / 150000) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${(sec80C / 150000) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `₹${Number(sec80C).toLocaleString('en-IN')}`)
                    ])
                ]),
                // HRA
                h('div', null, [
                    h('label', { for: 'hra', class: 'label-text flex items-center mb-1' }, [
                        'HRA Exemption (₹)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'HRA exempted amount for salaried employees')
                        ])
                    ]),
                    h('input', {
                        id: 'hra',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '0',
                        step: '5000',
                        value: hra,
                        onInput: (e) => setHra(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '0',
                            max: '500000',
                            step: '5000',
                            value: hra,
                            onInput: (e) => setHra(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${(hra / 500000) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${(hra / 500000) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `₹${Number(hra).toLocaleString('en-IN')}`)
                    ])
                ]),
                // NPS
                h('div', null, [
                    h('label', { for: 'nps', class: 'label-text flex items-center mb-1' }, [
                        'NPS Contribution 80CCD(1B) (₹)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'Additional NPS deduction up to ₹50,000')
                        ])
                    ]),
                    h('input', {
                        id: 'nps',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '0',
                        max: '50000',
                        step: '5000',
                        value: nps,
                        onInput: (e) => setNps(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '0',
                            max: '50000',
                            step: '5000',
                            value: nps,
                            onInput: (e) => setNps(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${(nps / 50000) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${(nps / 50000) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `₹${Number(nps).toLocaleString('en-IN')}`)
                    ])
                ]),
                // Other Deductions
                h('div', null, [
                    h('label', { for: 'otherDed', class: 'label-text flex items-center mb-1' }, [
                        'Other Deductions (₹)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, '80D medical, 80E education loan interest, etc.')
                        ])
                    ]),
                    h('input', {
                        id: 'otherDed',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '0',
                        step: '5000',
                        value: otherDed,
                        onInput: (e) => setOtherDed(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    })
                ])
            ]),
            h('div', { class: 'flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800' }, [
                h('button', { id: 'resetBtn', class: 'ghost', onClick: handleReset }, 'Reset')
            ])
        ]),

        // Recommendation Banner
        h('section', { id: 'recommSection', class: 'mt-8' }, [
            h('div', { id: 'recommBanner', class: 'bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 md:p-8 flex items-center gap-6 flex-wrap shadow-lg text-white mb-8' }, [
                h('div', { style: 'font-size:40px;' }, '🏆'),
                h('div', null, [
                    h('div', { style: 'color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;' }, 'Recommended Regime'),
                    h('div', { id: 'recommText', class: 'text-2xl md:text-3xl font-extrabold mt-1' }, 
                        results.recommendation === 'new' ? '🆕 New Regime saves you more' : '📋 Old Regime saves you more'
                    ),
                ]),
                h('div', { style: 'margin-left:auto;text-align:right;' }, [
                    h('div', { style: 'color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;' }, 'You Save'),
                    h('div', { id: 'savingsText', class: 'text-2xl md:text-3xl font-extrabold' }, `${formatINR(results.savings)}/yr`),
                ])
            ])
        ]),

        // Comparison Table
        h('section', { class: 'mt-8' }, [
            h('h2', { class: 'text-2xl font-bold mb-6' }, 'Regime Comparison'),
            h('div', { class: 'overflow-x-auto' }, [
                h('table', { class: 'w-full text-left border-collapse' }, [
                    h('thead', null, [
                        h('tr', null, [
                            h('th', { class: 'px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800' }, 'Parameter'),
                            h('th', { class: 'px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800' }, 'Old Regime'),
                            h('th', { class: 'px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800' }, 'New Regime (FY 2025-26)'),
                        ])
                    ]),
                    h('tbody', null, [
                        [
                            ['Gross Income', formatINR(grossIncome), formatINR(grossIncome)],
                            ['Standard Deduction', formatINR(50000), formatINR(75000)],
                            ['Section 80C', formatINR(Math.min(sec80C, 150000)), '–'],
                            ['HRA Exemption', formatINR(hra), '–'],
                            ['NPS (80CCD 1B)', formatINR(Math.min(nps, 50000)), '–'],
                            ['Other Deductions', formatINR(otherDed), '–'],
                            ['Total Deductions', formatINR(Math.min(sec80C, 150000) + hra + Math.min(nps, 50000) + otherDed + 50000), formatINR(75000)],
                            ['Taxable Income', formatINR(results.oldTaxableIncome), formatINR(results.newTaxableIncome)],
                            ['Tax + Cess (4%)', formatINR(results.oldRegimeTax), formatINR(results.newRegimeTax), true],
                            ['Monthly Tax', formatINR(results.oldRegimeTax / 12), formatINR(results.newRegimeTax / 12), true],
                        ].map(([param, oldVal, newVal, highlight]) => 
                            h('tr', { class: highlight ? 'highlight-row' : '' }, [
                                h('td', { class: 'px-4 py-3 border-b border-slate-100 dark:border-slate-800/50', style: highlight ? 'font-weight:700' : '' }, param),
                                h('td', { class: `px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 ${highlight ? (results.recommendation === 'old' ? 'better' : 'worse') : ''}` }, oldVal),
                                h('td', { class: `px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 ${highlight ? (results.recommendation === 'new' ? 'better' : 'worse') : ''}` }, newVal),
                            ])
                        )
                    ])
                ])
            ])
        ]),

        // Chart Section
        h('section', { class: 'mt-12' }, [
            h('div', { class: 'card p-6 md:p-8' }, [
                h('div', { class: 'text-lg font-bold mb-6 text-center' }, 'Tax Comparison: Old vs New Regime'),
                h('div', { style: 'height: 300px; position: relative;' }, [
                    h('canvas', { id: 'taxBarChart' })
                ])
            ])
        ]),

        // Slab Visualization
        h('section', { class: 'mt-12' }, [
            h('h2', { class: 'text-2xl font-bold mb-6' }, 'Tax Slab Breakdown'),
            h('div', { class: 'grid grid-cols-1 lg:grid-cols-2 gap-8' }, [
                // Old Regime Slabs
                h('div', { class: 'card p-6' }, [
                    h('h3', { class: 'font-bold mb-4 text-teal-700 dark:text-teal-400' }, 'Old Regime Slabs'),
                    h('div', { class: 'space-y-3' }, oldBreakdown.map(slab => 
                        h('div', { class: 'flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50' }, [
                            h('div', { class: 'flex justify-between text-sm mb-1' }, [
                                h('span', { class: 'font-medium' }, `${slab.from === 0 ? 'Up to' : slab.to === Infinity ? 'Above' : `${lakhFmt(slab.from)} - ${lakhFmt(slab.to)}`}`),
                                h('span', { class: 'text-slate-500' }, `${slab.rate}%`)
                            ]),
                            h('div', { class: 'flex justify-between items-end' }, [
                                h('div', { class: 'text-xs text-slate-500' }, slab.taxableInSlab > 0 ? `Taxable: ${formatINR(slab.taxableInSlab)}` : 'No taxable income in this slab'),
                                h('div', { class: 'font-bold text-slate-900 dark:text-white' }, formatINR(slab.tax))
                            ]),
                            slab.taxableInSlab > 0 && h('div', { class: 'mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden' }, [
                                h('div', { 
                                    class: 'h-full bg-teal-500', 
                                    style: { width: `${Math.min(100, (slab.taxableInSlab / (slab.to === Infinity ? results.oldTaxableIncome : (slab.to - slab.from))) * 100)}%` } 
                                })
                            ])
                        ])
                    ))
                ]),
                // New Regime Slabs
                h('div', { class: 'card p-6' }, [
                    h('h3', { class: 'font-bold mb-4 text-teal-700 dark:text-teal-400' }, 'New Regime Slabs (FY 2025-26)'),
                    h('div', { class: 'space-y-3' }, newBreakdown.map(slab => 
                        h('div', { class: 'flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50' }, [
                            h('div', { class: 'flex justify-between text-sm mb-1' }, [
                                h('span', { class: 'font-medium' }, `${slab.from === 0 ? 'Up to' : slab.to === Infinity ? 'Above' : `${lakhFmt(slab.from)} - ${lakhFmt(slab.to)}`}`),
                                h('span', { class: 'text-slate-500' }, `${slab.rate}%`)
                            ]),
                            h('div', { class: 'flex justify-between items-end' }, [
                                h('div', { class: 'text-xs text-slate-500' }, slab.taxableInSlab > 0 ? `Taxable: ${formatINR(slab.taxableInSlab)}` : 'No taxable income in this slab'),
                                h('div', { class: 'font-bold text-slate-900 dark:text-white' }, formatINR(slab.tax))
                            ]),
                            slab.taxableInSlab > 0 && h('div', { class: 'mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden' }, [
                                h('div', { 
                                    class: 'h-full bg-teal-500', 
                                    style: { width: `${Math.min(100, (slab.taxableInSlab / (slab.to === Infinity ? results.newTaxableIncome : (slab.to - slab.from))) * 100)}%` } 
                                })
                            ])
                        ])
                    ))
                ])
            ])
        ]),

        // Note Section
        h('section', { class: 'mt-12' }, [
            h('div', { class: 'bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-xl p-5 mb-10 flex items-start gap-4' }, [
                h('div', { class: 'text-2xl' }, '📌'),
                h('div', null, [
                    h('h4', { class: 'font-bold text-teal-800 dark:text-teal-300 mb-1' }, 'Note on Tax Slabs (FY 2025-26)'),
                    h('p', { class: 'text-sm text-teal-700 dark:text-teal-400/80' }, [
                        'The New Regime for FY 2025-26 offers a ₹75,000 standard deduction and a ₹60,000 rebate u/s 87A for incomes up to ₹12L. Tax is calculated + 4% Health & Education Cess. Values shown are ',
                        h('strong', null, 'estimates'),
                        '—consult a CA for exact liability.'
                    ])
                ])
            ])
        ])
    ]);
};

export default IncomeTaxCalculator;
