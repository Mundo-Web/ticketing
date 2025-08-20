import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PieData {
    name: string;
    value: number;
    color: string;
}

interface D3PieChartProps {
    data: PieData[];
    width?: number;
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    onSliceClick?: (data: PieData) => void;
}

const D3PieChart: React.FC<D3PieChartProps> = ({
    data,
    width = 500,
    height = 500,
    innerRadius = 80,
    outerRadius = 160,
    onSliceClick
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous content

        const g = svg
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Create pie generator
        const pie = d3.pie<PieData>()
            .value(d => d.value)
            .sort(null)
            .padAngle(0.02);

        // Create arc generator
        const arc = d3.arc<d3.PieArcDatum<PieData>>()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .cornerRadius(4);

        // Create arcs
        const arcs = g.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        // Add paths
        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .style('cursor', 'pointer')
            .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.8)
                    .style('transform', 'scale(1.05)');

                // Tooltip
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const percentage = Math.round((d.data.value / total) * 100);

                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0, 0, 0, 0.9)')
                    .style('color', 'white')
                    .style('padding', '12px 16px')
                    .style('border-radius', '12px')
                    .style('font-size', '14px')
                    .style('font-weight', '500')
                    .style('pointer-events', 'none')
                    .style('opacity', 0)
                    .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.3)');

                tooltip
                    .html(`
                        <div style="text-align: center;">
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">
                                ${d.data.name}
                            </div>
                            <div style="color: #E5E7EB;">
                                ${d.data.value} tickets (${percentage}%)
                            </div>
                        </div>
                    `)
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
                    .style('opacity', 1)
                    .style('transform', 'scale(1)');

                d3.selectAll('.tooltip').remove();
            })
            .on('click', function(event, d) {
                if (onSliceClick) {
                    onSliceClick(d.data);
                }
            })
            .transition()
            .duration(800)
            .ease(d3.easeBackOut)
            .attrTween('d', function(d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function(t) {
                    return arc(interpolate(t)) || '';
                };
            });

        // Add labels
        arcs.append('text')
            .attr('transform', d => {
                const centroid = arc.centroid(d);
                return `translate(${centroid})`;
            })
            .attr('dy', '0.35em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#fff')
            .style('text-shadow', '1px 1px 2px rgba(0, 0, 0, 0.7)')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .text(d => {
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const percentage = Math.round((d.data.value / total) * 100);
                return percentage > 5 ? `${percentage}%` : ''; // Only show if > 5%
            })
            .transition()
            .delay(600)
            .duration(400)
            .style('opacity', 1);

        // Center text with total
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .style('font-size', '32px')
            .style('font-weight', 'bold')
            .style('fill', '#1F2937')
            .style('opacity', 0)
            .text(total)
            .transition()
            .delay(800)
            .duration(400)
            .style('opacity', 1);

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.2em')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .style('fill', '#6B7280')
            .style('opacity', 0)
            .text('Total Tickets')
            .transition()
            .delay(800)
            .duration(400)
            .style('opacity', 1);

        // Legend
        const legendData = data.filter(d => d.value > 0);
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, ${height - (legendData.length * 25 + 20)})`);

        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`)
            .style('cursor', 'pointer')
            .on('click', function(event, d) {
                if (onSliceClick) {
                    onSliceClick(d);
                }
            });

        legendItems.append('rect')
            .attr('width', 16)
            .attr('height', 16)
            .attr('rx', 3)
            .attr('fill', d => d.color)
            .style('opacity', 0)
            .transition()
            .delay(1000)
            .duration(400)
            .style('opacity', 1);

        legendItems.append('text')
            .attr('x', 24)
            .attr('y', 8)
            .attr('dy', '0.35em')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .style('fill', '#374151')
            .style('opacity', 0)
            .text(d => `${d.name} (${d.value})`)
            .transition()
            .delay(1000)
            .duration(400)
            .style('opacity', 1);

    }, [data, width, height, innerRadius, outerRadius, onSliceClick]);

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            style={{ overflow: 'visible' }}
        />
    );
};

export default D3PieChart;