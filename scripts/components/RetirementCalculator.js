import { h } from 'https://esm.sh/preact@10.19.2';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact@10.19.2/hooks';
import { formatINR } from '../util.js';
import { calculateRetirementCorpus } from '../finance.js';

const RetirementCalculator = () => {
    // State for inputs
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [monthlyExpense, setMonthlyExpense] = useState(50000);
    const [postRetYears, setPostRetYears] = useState(25);
    const [inflation, setInflation] = useState(6);
    const [returnRate, setReturnRate] = useState(12);
    const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');

    // Load from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('ca')) setCurrentAge(Number(params.get('ca')));
        if (params.has('ra')) setRetirementAge(Number(params.get('ra')));
        if (params.has('me')) setMonthlyExpense(Number(params.get('me')));
        if (params.has('pry')) setPostRetYears(Number(params.get('pry')));
        if (params.has('inf')) setInflation(Number(params.get('inf')));
        if (params.has('ret')) setReturnRate(Number(params.get('ret')));

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
        params.set('ca', currentAge);
        params.set('ra', retirementAge);
        params.set('me', monthlyExpense);
        params.set('pry', postRetYears);
        params.set('inf', inflation);
        params.set('ret', returnRate);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }, [currentAge, retirementAge, monthlyExpense, postRetYears, inflation, returnRate]);

    // Calculations
    const results = useMemo(() => {
        if (currentAge <= 0 || retirementAge <= currentAge || monthlyExpense <= 0 || inflation <= 0 || returnRate <= 0) {
            return null;
        }
        return calculateRetirementCorpus(currentAge, retirementAge, monthlyExpense, inflation, returnRate, postRetYears);
    }, [currentAge, retirementAge, monthlyExpense, postRetYears, inflation, returnRate]);

    const chartData = useMemo(() => {
        if (!results) return null;
        const totalInvestment = results.monthlySIPNeeded * 12 * results.yearsToRetire;
        const estReturns = results.corpusNeeded - totalInvestment;
        return { totalInvestment, estReturns };
    }, [results]);

    // Chart Effect
    useEffect(() => {
        if (!chartData) return;
        const ctx = document.getElementById('donutChart')?.getContext('2d');
        if (!ctx) return;

        const isDark = theme === 'dark';
        
        if (window.chartInstance) {
            window.chartInstance.destroy();
        }

        window.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Total Investment', 'Estimated Returns'],
                datasets: [{
                    data: [chartData.totalInvestment, chartData.estReturns],
                    backgroundColor: ['rgba(13,148,136,0.85)', 'rgba(8,145,178,0.75)'],
                    hoverBackgroundColor: ['rgba(13,148,136,1)', 'rgba(8,145,178,1)'],
                    borderColor: isDark ? '#0f172a' : '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8,
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.label}: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
                        }
                    }
                },
                animation: { animateRotate: true, duration: 600 },
                maintainAspectRatio: false
            }
        });

        return () => {
            if (window.chartInstance) {
                window.chartInstance.destroy();
                window.chartInstance = null;
            }
        };
    }, [chartData, theme]);

    const handleReset = () => {
        setCurrentAge(30);
        setRetirementAge(60);
        setMonthlyExpense(50000);
        setPostRetYears(25);
        setInflation(6);
        setReturnRate(12);
    };

    return h('div', { class: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24' }, [
        h('section', { class: 'card p-6 md:p-8 mb-8' }, [
            h('div', { class: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' }, [
                // Current Age
                h('div', null, [
                    h('label', { for: 'currentAge', class: 'label-text flex items-center mb-1' }, 'Current Age (Years)'),
                    h('input', {
                        id: 'currentAge',
                        type: 'number',
                        min: '18',
                        max: '70',
                        step: '1',
                        value: currentAge,
                        onInput: (e) => setCurrentAge(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '18',
                            max: '65',
                            step: '1',
                            value: currentAge,
                            onInput: (e) => setCurrentAge(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${((currentAge - 18) / (65 - 18)) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${((currentAge - 18) / (65 - 18)) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `${currentAge} yrs`)
                    ])
                ]),
                // Retirement Age
                h('div', null, [
                    h('label', { for: 'retirementAge', class: 'label-text flex items-center mb-1' }, 'Retirement Age (Years)'),
                    h('input', {
                        id: 'retirementAge',
                        type: 'number',
                        min: '40',
                        max: '80',
                        step: '1',
                        value: retirementAge,
                        onInput: (e) => setRetirementAge(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '40',
                            max: '80',
                            step: '1',
                            value: retirementAge,
                            onInput: (e) => setRetirementAge(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${((retirementAge - 40) / (80 - 40)) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${((retirementAge - 40) / (80 - 40)) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `${retirementAge} yrs`)
                    ])
                ]),
                // Monthly Expense
                h('div', null, [
                    h('label', { for: 'monthlyExpense', class: 'label-text flex items-center mb-1' }, [
                        'Monthly Expense at Retirement (₹ today\'s value)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'How much would you spend per month if you retired today?')
                        ])
                    ]),
                    h('input', {
                        id: 'monthlyExpense',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '5000',
                        step: '5000',
                        value: monthlyExpense,
                        onInput: (e) => setMonthlyExpense(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '10000',
                            max: '500000',
                            step: '5000',
                            value: monthlyExpense,
                            onInput: (e) => setMonthlyExpense(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${((monthlyExpense - 10000) / (500000 - 10000)) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${((monthlyExpense - 10000) / (500000 - 10000)) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `₹${Number(monthlyExpense).toLocaleString('en-IN')}`)
                    ])
                ]),
                // Post Retirement Years
                h('div', null, [
                    h('label', { for: 'postRetYears', class: 'label-text flex items-center mb-1' }, [
                        'Post-Retirement Life (Years)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'How many years to fund after retirement?')
                        ])
                    ]),
                    h('input', {
                        id: 'postRetYears',
                        type: 'number',
                        min: '5',
                        max: '50',
                        step: '1',
                        value: postRetYears,
                        onInput: (e) => setPostRetYears(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '5',
                            max: '50',
                            step: '1',
                            value: postRetYears,
                            onInput: (e) => setPostRetYears(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${((postRetYears - 5) / (50 - 5)) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${((postRetYears - 5) / (50 - 5)) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `${postRetYears} yrs`)
                    ])
                ]),
                // Inflation
                h('div', null, [
                    h('label', { for: 'retInflation', class: 'label-text flex items-center mb-1' }, [
                        'Inflation Rate (% p.a.)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'Expected annual inflation rate')
                        ])
                    ]),
                    h('input', {
                        id: 'retInflation',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '1',
                        max: '15',
                        step: '0.5',
                        value: inflation,
                        onInput: (e) => setInflation(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '1',
                            max: '15',
                            step: '0.5',
                            value: inflation,
                            onInput: (e) => setInflation(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${((inflation - 1) / (15 - 1)) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${((inflation - 1) / (15 - 1)) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `${parseFloat(inflation).toFixed(1)}%`)
                    ])
                ]),
                // Expected Return
                h('div', null, [
                    h('label', { for: 'retReturn', class: 'label-text flex items-center mb-1' }, [
                        'Expected Return (% p.a.)',
                        h('div', { class: 'group relative ml-2 cursor-help' }, [
                            h('span', { class: 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400' }, '?'),
                            h('div', { class: 'hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg -left-2 top-full' }, 'Expected investment return during accumulation')
                        ])
                    ]),
                    h('input', {
                        id: 'retReturn',
                        type: 'number',
                        inputmode: 'decimal',
                        min: '1',
                        max: '25',
                        step: '0.5',
                        value: returnRate,
                        onInput: (e) => setReturnRate(Number(e.target.value)),
                        class: 'input-field mb-4 w-full'
                    }),
                    h('div', { class: 'flex items-center space-x-4' }, [
                        h('input', {
                            type: 'range',
                            min: '4',
                            max: '20',
                            step: '0.5',
                            value: returnRate,
                            onInput: (e) => setReturnRate(Number(e.target.value)),
                            class: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-teal-600',
                            style: { background: `linear-gradient(to right, #0d9488 ${((returnRate - 4) / (20 - 4)) * 100}%, ${theme === 'dark' ? '#334155' : '#e2e8f0'} ${((returnRate - 4) / (20 - 4)) * 100}%)` }
                        }),
                        h('span', { class: 'text-sm font-semibold text-teal-700 dark:text-teal-400 min-w-[3rem] text-right' }, `${parseFloat(returnRate).toFixed(1)}%`)
                    ])
                ])
            ]),
            h('div', { class: 'flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800' }, [
                h('button', { id: 'resetBtn', class: 'ghost', onClick: handleReset }, 'Reset')
            ])
        ]),

        results && h('div', { id: 'resultsSection', class: 'mt-8' }, [
            h('h2', { class: 'text-2xl font-bold mb-6' }, 'Overview'),
            h('div', { class: 'grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10' }, [
                h('div', { class: 'card p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80' }, [
                    h('div', { class: 'space-y-6' }, [
                        h('div', { class: 'flex flex-col space-y-1' }, [
                            h('div', { class: 'text-sm font-medium text-slate-500 dark:text-slate-400' }, 'Years to Retirement'),
                            h('div', { class: 'text-2xl font-bold text-slate-900 dark:text-white' }, `${results.yearsToRetire} years`)
                        ]),
                        h('div', { class: 'flex flex-col space-y-1' }, [
                            h('div', { class: 'text-sm font-medium text-slate-500 dark:text-slate-400' }, 'Monthly Expense at Retirement'),
                            h('div', { class: 'text-2xl font-bold text-slate-900 dark:text-white' }, formatINR(results.retMonthlyExpense))
                        ]),
                        h('div', { class: 'flex flex-col space-y-1' }, [
                            h('div', { class: 'text-sm font-medium text-slate-500 dark:text-slate-400' }, 'Corpus Needed at Retirement'),
                            h('div', { class: 'text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400' }, formatINR(results.corpusNeeded))
                        ]),
                        h('div', { class: 'flex flex-col space-y-1' }, [
                            h('div', { class: 'text-sm font-medium text-slate-500 dark:text-slate-400' }, 'Monthly SIP Required Now'),
                            h('div', { class: 'text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400' }, formatINR(results.monthlySIPNeeded))
                        ])
                    ])
                ]),
                h('div', { class: 'card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8' }, [
                    h('div', { class: 'w-48 h-48 sm:w-56 sm:h-56 relative flex-shrink-0' }, [
                        h('canvas', { id: 'donutChart' })
                    ]),
                    h('div', { id: 'chartLegend', class: 'flex-1 w-full space-y-3' }, [
                        chartData && [
                            h('div', { class: 'flex items-center justify-between' }, [
                                h('div', { class: 'flex items-center' }, [
                                    h('div', { class: 'w-3 h-3 rounded-full mr-3', style: 'background:rgba(13,148,136,0.85)' }),
                                    h('span', { class: 'text-sm text-slate-600 dark:text-slate-400' }, 'Total Investment')
                                ]),
                                h('span', { class: 'font-semibold text-slate-900 dark:text-white' }, `₹${Number(chartData.totalInvestment).toLocaleString('en-IN')}`)
                            ]),
                            h('div', { class: 'flex items-center justify-between' }, [
                                h('div', { class: 'flex items-center' }, [
                                    h('div', { class: 'w-3 h-3 rounded-full mr-3', style: 'background:rgba(8,145,178,0.75)' }),
                                    h('span', { class: 'text-sm text-slate-600 dark:text-slate-400' }, 'Estimated Returns')
                                ]),
                                h('span', { class: 'font-semibold text-slate-900 dark:text-white' }, `₹${Number(chartData.estReturns).toLocaleString('en-IN')}`)
                            ])
                        ]
                    ])
                ])
            ])
        ])
    ]);
};

export default RetirementCalculator;
