import { h } from 'https://esm.sh/preact';
import { useEffect, useState, useRef } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

/**
 * GlassCard Component
 * A wrapper using the .glass CSS class.
 */
export const GlassCard = ({ children, className = '' }) => {
  return html`
    <div class="glass rounded-2xl p-6 shadow-lg ${className}">
      ${children}
    </div>
  `;
};

/**
 * Slider Component
 * A label, a range input, and a text input that stay in sync.
 */
export const Slider = ({ label, value, min, max, step = 1, onChange, suffix = '' }) => {
  const handleInputChange = (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    // We don't clamp immediately to allow typing, but we should notify parent
    onChange(val);
  };

  const handleBlur = (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = min;
    if (val < min) val = min;
    if (val > max) val = max;
    onChange(val);
  };

  return html`
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <label class="label-text mb-0">${label}</label>
        <div class="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1">
          <input
            type="number"
            class="w-24 text-right bg-transparent border-none focus:outline-none font-semibold text-teal-700 dark:text-teal-400"
            value=${value}
            onInput=${handleInputChange}
            onBlur=${handleBlur}
          />
          <span class="ml-1 text-xs font-medium text-slate-500 uppercase">${suffix}</span>
        </div>
      </div>
      <input
        type="range"
        class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
        min=${min}
        max=${max}
        step=${step}
        value=${value}
        onInput=${(e) => onChange(parseFloat(e.target.value))}
      />
      <div class="flex justify-between mt-1">
        <span class="text-xs text-slate-400">${min.toLocaleString('en-IN')}</span>
        <span class="text-xs text-slate-400">${max.toLocaleString('en-IN')}</span>
      </div>
    </div>
  `;
};

/**
 * AnimatedValue Component
 * Internal helper for ResultSummary to animate numbers.
 */
const AnimatedValue = ({ value, suffix = '', prefix = '', decimals = 0, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);
  const targetValueRef = useRef(value);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    startValueRef.current = displayValue;
    targetValueRef.current = value;
    startTimeRef.current = performance.now();
    
    let animationFrame;
    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const nextValue = startValueRef.current + (targetValueRef.current - startValueRef.current) * easedProgress;
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  const formatted = typeof displayValue === 'number' 
    ? displayValue.toLocaleString('en-IN', { 
        maximumFractionDigits: decimals, 
        minimumFractionDigits: decimals 
      })
    : displayValue;

  return html`<span>${prefix}${formatted}${suffix}</span>`;
};

/**
 * ResultSummary Component
 * A display for 2-4 primary KPIs with animated values.
 */
export const ResultSummary = ({ items }) => {
  return html`
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      ${items.map((item) => html`
        <div class="text-center p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">${item.label}</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">
            <${AnimatedValue} 
              value=${item.value} 
              suffix=${item.suffix || ''} 
              prefix=${item.prefix || ''} 
              decimals=${item.decimals ?? 0} 
            />
          </p>
        </div>
      `)}
    </div>
  `;
};

/**
 * AmortizationTable Component
 * A clean table for loan schedules.
 */
export const AmortizationTable = ({ data }) => {
  if (!data || data.length === 0) return null;

  return html`
    <div class="table-container mt-8 overflow-x-auto">
      <table class="data-table w-full">
        <thead>
          <tr>
            <th class="text-left">Month</th>
            <th class="text-right">Principal</th>
            <th class="text-right">Interest</th>
            <th class="text-right">Total</th>
            <th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((row) => html`
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="text-left">${row.month}</td>
              <td class="text-right">${row.principal.toLocaleString('en-IN')}</td>
              <td class="text-right">${row.interest.toLocaleString('en-IN')}</td>
              <td class="text-right">${row.total.toLocaleString('en-IN')}</td>
              <td class="text-right font-medium">${row.balance.toLocaleString('en-IN')}</td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * VisualChart Component
 * A Chart.js wrapper component.
 */
export const VisualChart = ({ type, data, options, height = 300 }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && window.Chart) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      chartRef.current = new window.Chart(canvasRef.current, {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }
      });
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);

  return html`
    <div class="relative w-full" style=${{ height: `${height}px` }}>
      <canvas ref=${canvasRef}></canvas>
    </div>
  `;
};
