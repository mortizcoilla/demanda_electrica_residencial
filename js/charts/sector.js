// ===========================================================
// charts/sector.js — Donut: composición de la demanda SEN 2024
// ===========================================================

import { C, showTip, hideTip } from '../utils.js';
import { SECTOR_DATA } from '../data.js';

export function initSectorChart() {
  const svg = d3.select('#chart-sector');
  const W = 700, H = 320;
  const radius = 110;
  const innerR = 70;
  const cx = 175, cy = H / 2;
  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  const pie = d3.pie().value(d => d.value).sort(null).padAngle(0.02);
  const arc = d3.arc().innerRadius(innerR).outerRadius(radius).cornerRadius(4);
  const arcHover = d3.arc().innerRadius(innerR).outerRadius(radius + 8).cornerRadius(4);

  // segments
  g.selectAll('path')
    .data(pie(SECTOR_DATA))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .attr('stroke', '#fafafa')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function (evt, d) {
      d3.select(this).transition().duration(120).attr('d', arcHover);
      showTip(evt, `<strong>${d.data.label}</strong><br>${d.data.value}% de la demanda SEN`);
    })
    .on('mousemove', evt => {
      d3.select('#tooltip')
        .style('left', (evt.clientX + 12) + 'px')
        .style('top', (evt.clientY - 12) + 'px');
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('d', arc);
      hideTip();
    });

  // center label
  g.append('text').attr('text-anchor', 'middle').attr('y', -8)
    .attr('font-size', 14).attr('fill', C.ink3).attr('font-weight', 600)
    .text('DEMANDA SEN');
  g.append('text').attr('text-anchor', 'middle').attr('y', 24)
    .attr('font-size', 38).attr('fill', C.ink).attr('font-weight', 600)
    .attr('font-family', "'Outfit', sans-serif")
    .text('~85 TWh');
  g.append('text').attr('text-anchor', 'middle').attr('y', 44)
    .attr('font-size', 12).attr('fill', C.ink4)
    .text('año 2024');

  // side legend
  const detail = svg.append('g').attr('transform', `translate(${cx + radius + 50}, 60)`);
  detail.append('text').attr('font-size', 11).attr('fill', C.ink3)
    .attr('letter-spacing', '0.06em').attr('font-weight', 600)
    .text('REPARTO POR SECTOR');
  SECTOR_DATA.forEach((d, i) => {
    const r = detail.append('g').attr('transform', `translate(0, ${24 + i * 40})`);
    r.append('rect').attr('width', 14).attr('height', 14).attr('rx', 3).attr('fill', d.color);
    r.append('text').attr('x', 22).attr('y', 11).attr('font-size', 13).attr('fill', C.ink2).text(d.label);
    r.append('text').attr('x', 0).attr('y', 32).attr('font-size', 22).attr('fill', C.ink).attr('font-weight', 600).text(d.value + '%');
  });
}
