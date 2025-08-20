import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ChartData {
    name: string;
    value: number;
}

interface D3BarChartProps {
    data: ChartData[];
    width?: number;
    height?: number;
    color?: string;
    title?: string;
    valueLabel?: string;
}

const D3BarChart: React.FC<D3BarChartProps> = ({
    data,
    width = 400,
    height = 300,
    color = '#3B82F6',
    title = 'Chart',
    valueLabel = 'Value'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous content

        const margin = { top: 20, right: 30, bottom: 60, left: 120 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create main group
        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.value) || 0])
            .range([0, innerWidth]);

        const yScale = d3
            .scaleBand()
            .domain(data.map(d => d.name))
            .range([0, innerHeight])
            .padding(0.2);

        // Create gradient
        const gradient = svg
            .append('defs')
            .append('linearGradient')
            .attr('id', `gradient-${title.replace(/\s+/g, '-')}`)
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', innerWidth).attr('y2', 0);

        gradient
            .append('stop')
            .attr('offset', '0%')
            .attr('stop-color', color)
            .attr('stop-opacity', 0.8);

        gradient
            .append('stop')
            .attr('offset', '100%')
            .attr('stop-color', color)
            .attr('stop-opacity', 1);

        // Bars
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.name) || 0)
            .attr('height', yScale.bandwidth())
            .attr('fill', `url(#gradient-${title.replace(/\s+/g, '-')})`)
            .attr('rx', 4)
            .attr('ry', 4)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.8);

                // Tooltip
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0, 0, 0, 0.8)')
                    .style('color', 'white')
                    .style('padding', '8px 12px')
                    .style('border-radius', '8px')
                    .style('font-size', '14px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);

                tooltip
                    .html(`<strong>${d.name}</strong><br/>${valueLabel}: ${d.value}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1);

                d3.selectAll('.tooltip').remove();
            })
            .transition()
            .duration(800)
            .ease(d3.easeBackOut)
            .attr('width', d => xScale(d.value));

        // Value labels on bars
        g.selectAll('.value-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => xScale(d.value) + 5)
            .attr('y', d => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .style('opacity', 0)
            .text(d => d.value)
            .transition()
            .delay(400)
            .duration(400)
            .style('opacity', 1);

        // Y Axis (names)
        g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px')
            .style('font-weight', '500')
            .style('fill', '#374151');

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .selectAll('text')
            .style('font-size', '11px')
            .style('fill', '#6B7280');

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisBottom(xScale)
                .ticks(5)
                .tickSize(-innerHeight)
                .tickFormat(() => '')
            )
            .style('opacity', 0.1);

        // Remove domain line
        g.selectAll('.domain').remove();

    }, [data, width, height, color, title, valueLabel]);

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            style={{ overflow: 'visible' }}
        />
    );
};

export default D3BarChart;