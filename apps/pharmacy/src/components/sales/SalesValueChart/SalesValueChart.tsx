'use client';

import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import clsx from 'clsx';

import { formatProductCategoryLabel } from '@e-pharmacy/config/products';
import type { ProductCategory } from '@e-pharmacy/types/products';

import type {
  OrderSalesStatistics,
  OrderSalesStatisticsPoint,
} from '@e-pharmacy/types/orders';

import { formatMoney } from '@e-pharmacy/utils/money';

import css from './SalesValueChart.module.css';

//===================================================================

const CHART_WIDTH = 720;
const CHART_HEIGHT = 300;
const GRID_LINES_COUNT = 4;
const SERIES_DASH_PATTERNS = ['', '10 6', '3 5', '14 5 3 5', '7 4', '2 4'];

const CHART_PADDING = {
  top: 24,
  right: 22,
  bottom: 44,
  left: 58,
} as const;

const CHART_INNER_WIDTH =
  CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const CHART_INNER_HEIGHT =
  CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

//===================================================================

export type SalesValueChartProps = Readonly<{
  data: OrderSalesStatistics;
  className?: string;
  kicker?: string;
  title?: string;
  description?: string;
  categoryControlsLabel?: string;
  headerContent?: ReactNode;
}>;

type ChartSeries = Readonly<{
  category: ProductCategory;
  points: Array<{ x: number; y: number; value: number }>;
  linePath: string;
  areaPath: string;
}>;

//===================================================================

function getCategoryColorVar(category: ProductCategory): string {
  return `var(--color-chart-${category})`;
}

//===================================================================

function getCategoryFillVar(category: ProductCategory): string {
  return `var(--color-chart-${category}-soft)`;
}

//===================================================================

function getPointValue(
  point: OrderSalesStatisticsPoint,
  category: ProductCategory
): number {
  return point.values[category]?.amount ?? 0;
}

//===================================================================

function getNiceMaxValue(value: number): number {
  if (value <= 0) return 100;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

//===================================================================

function createPath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

//===================================================================

function createAreaPath(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return '';

  const baseline = CHART_PADDING.top + CHART_INNER_HEIGHT;
  const line = createPath(points);
  const lastPoint = points.at(-1);
  const firstPoint = points[0];

  if (!lastPoint || !firstPoint) return line;

  return `${line} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`;
}

//===================================================================

function getX(index: number, total: number): number {
  if (total <= 1) return CHART_PADDING.left + CHART_INNER_WIDTH / 2;

  return CHART_PADDING.left + (CHART_INNER_WIDTH * index) / (total - 1);
}

//===================================================================

function getY(value: number, maxValue: number): number {
  const ratio = maxValue > 0 ? value / maxValue : 0;

  return CHART_PADDING.top + CHART_INNER_HEIGHT - CHART_INNER_HEIGHT * ratio;
}

//===================================================================

function getVisibleTickIndexes(pointsLength: number): Set<number> {
  const tickIndexes = new Set<number>();
  if (!pointsLength) return tickIndexes;

  const step = Math.max(1, Math.ceil(pointsLength / 6));

  for (let index = 0; index < pointsLength; index += step) {
    tickIndexes.add(index);
  }

  tickIndexes.add(pointsLength - 1);
  return tickIndexes;
}

//===================================================================

function getPointAriaLabel(
  point: OrderSalesStatisticsPoint,
  categories: readonly ProductCategory[]
): string {
  const values = categories
    .map((category) => {
      const value =
        formatMoney(getPointValue(point, category)) ?? 'not available';
      return `${formatProductCategoryLabel(category)}: ${value}`;
    })
    .join(', ');

  return `${point.label}. ${values}`;
}

//===================================================================

function SalesValueChart({
  data,
  className,
  kicker = 'Sales chart',
  title = 'Sales value by product category',
  description = 'Lines show successful sales grouped by sold product categories for the selected period.',
  categoryControlsLabel = 'Product categories shown on the chart',
  headerContent,
}: SalesValueChartProps) {
  const titleId = useId();
  const summaryId = useId();
  const tableId = useId();
  const pointRefs = useRef<Array<SVGRectElement | null>>([]);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<ProductCategory[]>(
    []
  );

  const visibleCategories = useMemo(
    () =>
      data.categories.filter(
        (category) => !hiddenCategories.includes(category)
      ),
    [data.categories, hiddenCategories]
  );

  const hasData = visibleCategories.length > 0 && data.points.length > 0;

  const maxValue = useMemo(() => {
    const values = data.points.flatMap((point) =>
      visibleCategories.map((category) => getPointValue(point, category))
    );

    return getNiceMaxValue(Math.max(0, ...values));
  }, [data.points, visibleCategories]);

  const series = useMemo<ChartSeries[]>(
    () =>
      visibleCategories.map((category) => {
        const points = data.points.map((point, index) => ({
          x: getX(index, data.points.length),
          y: getY(getPointValue(point, category), maxValue),
          value: getPointValue(point, category),
        }));

        return {
          category,
          points,
          linePath: createPath(points),
          areaPath: createAreaPath(points),
        };
      }),
    [data.points, maxValue, visibleCategories]
  );

  const tickIndexes = useMemo(
    () => getVisibleTickIndexes(data.points.length),
    [data.points.length]
  );

  const activePoint =
    activePointIndex === null ? undefined : data.points[activePointIndex];
  const activeX =
    activePointIndex === null
      ? CHART_PADDING.left
      : getX(activePointIndex, data.points.length);

  const summary = hasData
    ? `${title}. ${data.points.length} time points and ${visibleCategories.length} visible product categories. Use Left and Right Arrow keys on chart points, or open the data table below.`
    : `${title}. No successful sales are available for the selected period.`;

  const toggleCategory = (category: ProductCategory) => {
    setHiddenCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      if (visibleCategories.length === 1) return current;
      return [...current, category];
    });
  };

  const focusPoint = (index: number) => {
    const normalizedIndex = Math.min(
      data.points.length - 1,
      Math.max(0, index)
    );
    setActivePointIndex(normalizedIndex);
    pointRefs.current[normalizedIndex]?.focus();
  };

  const handlePointKeyDown = (
    event: KeyboardEvent<SVGRectElement>,
    index: number
  ) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusPoint(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusPoint(index + 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusPoint(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusPoint(data.points.length - 1);
    }
  };

  return (
    <section
      className={clsx(css.card, className)}
      aria-labelledby={titleId}
      aria-describedby={summaryId}
    >
      <div className={css.header}>
        <div className={css.titleGroup}>
          <p className={css.kicker}>{kicker}</p>
          <h3 className={css.title} id={titleId}>
            {title}
          </h3>
          <p className={css.description}>{description}</p>
          <p className={css.visuallyHidden} id={summaryId}>
            {summary}
          </p>
          {headerContent ? (
            <div className={css.headerContent}>{headerContent}</div>
          ) : null}
        </div>
      </div>

      {data.categories.length > 0 ? (
        <div
          className={css.categoryControls}
          role="group"
          aria-label={categoryControlsLabel}
        >
          {data.categories.map((category) => {
            const isActive = !hiddenCategories.includes(category);
            const categoryLabel = formatProductCategoryLabel(category);

            return (
              <button
                key={category}
                className={clsx(css.categoryButton, {
                  [css.categoryButtonInactive]: !isActive,
                })}
                type="button"
                aria-pressed={isActive}
                aria-label={`${isActive ? 'Hide' : 'Show'} ${categoryLabel}`}
                onClick={() => toggleCategory(category)}
              >
                <span
                  className={css.legendDot}
                  style={{ backgroundColor: getCategoryColorVar(category) }}
                  aria-hidden="true"
                />
                {categoryLabel}
              </button>
            );
          })}
        </div>
      ) : null}

      {hasData ? (
        <>
          <div
            className={css.chartWrap}
            onMouseLeave={() => setActivePointIndex(null)}
          >
            <svg
              className={css.chart}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="group"
              aria-label={`${title}. Interactive chart points.`}
              aria-describedby={summaryId}
            >
              <g className={css.gridLines} aria-hidden="true">
                {Array.from({ length: GRID_LINES_COUNT + 1 }, (_, index) => {
                  const value = (maxValue / GRID_LINES_COUNT) * index;
                  const y = getY(value, maxValue);

                  return (
                    <g key={value}>
                      <line
                        x1={CHART_PADDING.left}
                        x2={CHART_WIDTH - CHART_PADDING.right}
                        y1={y}
                        y2={y}
                      />
                      <text x={CHART_PADDING.left - 12} y={y + 4}>
                        {Math.round(value)}
                      </text>
                    </g>
                  );
                })}
              </g>

              <g className={css.areas} aria-hidden="true">
                {series.map((item) => (
                  <path
                    key={`${item.category}-area`}
                    d={item.areaPath}
                    fill={getCategoryFillVar(item.category)}
                  />
                ))}
              </g>

              <g className={css.lines} aria-hidden="true">
                {series.map((item, index) => (
                  <path
                    key={`${item.category}-line`}
                    d={item.linePath}
                    stroke={getCategoryColorVar(item.category)}
                    strokeDasharray={SERIES_DASH_PATTERNS[index]}
                  />
                ))}
              </g>

              <g className={css.dots} aria-hidden="true">
                {series.flatMap((item) =>
                  item.points.map((point, index) => (
                    <circle
                      key={`${item.category}-${data.points[index]?.key}`}
                      cx={point.x}
                      cy={point.y}
                      r={index === activePointIndex ? 5 : 3.5}
                      fill={getCategoryColorVar(item.category)}
                    />
                  ))
                )}
              </g>

              <g className={css.xAxis} aria-hidden="true">
                {data.points.map((point, index) =>
                  tickIndexes.has(index) ? (
                    <text
                      key={point.key}
                      x={getX(index, data.points.length)}
                      y={286}
                    >
                      {point.label}
                    </text>
                  ) : null
                )}
              </g>

              {activePoint ? (
                <g className={css.activeMarker} aria-hidden="true">
                  <line
                    x1={activeX}
                    x2={activeX}
                    y1={CHART_PADDING.top}
                    y2={CHART_PADDING.top + CHART_INNER_HEIGHT}
                  />
                </g>
              ) : null}

              <g className={css.hitAreas}>
                {data.points.map((point, index) => (
                  <rect
                    key={`hit-${point.key}`}
                    ref={(node) => {
                      pointRefs.current[index] = node;
                    }}
                    x={
                      getX(index, data.points.length) -
                      CHART_INNER_WIDTH / Math.max(1, data.points.length) / 2
                    }
                    y={CHART_PADDING.top}
                    width={CHART_INNER_WIDTH / Math.max(1, data.points.length)}
                    height={CHART_INNER_HEIGHT}
                    role="button"
                    tabIndex={0}
                    aria-controls={tableId}
                    aria-label={getPointAriaLabel(point, visibleCategories)}
                    onMouseEnter={() => setActivePointIndex(index)}
                    onFocus={() => setActivePointIndex(index)}
                    onBlur={() => setActivePointIndex(null)}
                    onKeyDown={(event) => handlePointKeyDown(event, index)}
                  />
                ))}
              </g>
            </svg>

            {activePoint ? (
              <div className={css.tooltip} role="status" aria-live="polite">
                <p className={css.tooltipTitle}>{activePoint.label}</p>
                <ul className={css.tooltipList}>
                  {visibleCategories.map((category) => {
                    const value = activePoint.values[category];

                    return (
                      <li key={category} className={css.tooltipItem}>
                        <span
                          className={css.tooltipDot}
                          style={{
                            backgroundColor: getCategoryColorVar(category),
                          }}
                          aria-hidden="true"
                        />
                        <span>{formatProductCategoryLabel(category)}</span>
                        <strong>
                          {formatMoney(value?.amount ?? 0) ?? '—'}
                        </strong>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>

          <details className={css.dataDetails}>
            <summary>View sales data table</summary>
            <div className={css.tableWrap}>
              <table className={css.dataTable} id={tableId}>
                <caption>{title}</caption>
                <thead>
                  <tr>
                    <th scope="col">Period</th>
                    {visibleCategories.map((category) => (
                      <th scope="col" key={category}>
                        {formatProductCategoryLabel(category)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.points.map((point) => (
                    <tr key={point.key}>
                      <th scope="row">{point.label}</th>
                      {visibleCategories.map((category) => (
                        <td key={category}>
                          {formatMoney(getPointValue(point, category)) ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <div className={css.emptyState}>
          <p className={css.emptyTitle}>
            No successful sales for this period yet.
          </p>
          <p className={css.emptyText}>
            The chart will appear after orders are marked as successful.
          </p>
        </div>
      )}
    </section>
  );
}

export default SalesValueChart;
export { SalesValueChart };
