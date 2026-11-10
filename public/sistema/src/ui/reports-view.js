/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/reports-view.js
   Página Relatórios — segue o padrão do relatorio-impressao.js
   do projeto Fluxo de Caixa (mesma estrutura, mesma técnica de PDF
   com jsPDF + autotable, mesmo uso de toExcelComAbas).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const format    = () => global.Planis.format;
    const state     = () => global.Planis.state;
    const calc      = () => global.Planis.relatoriosCalc;

    let chartLine = null;
    let chartPie = null;
    let chartEquity = null;

    const PDF_MARGEM_MM = 15;
    const PDF_HEADER_ALTURA = 25;
    const PDF_FOOTER_ALTURA = 15;
    const PDF_MAX_CHART_H = 70;

    const COR_PRIMARY  = [12, 66, 87];
    const COR_TEXT     = [26, 26, 46];
    const COR_MUTED    = [100, 116, 139];
    const COR_SUCCESS  = [5, 150, 105];
    const COR_DANGER   = [220, 38, 38];
    const COR_BORDER   = [221, 227, 233];
    const COR_STRIPE   = [248, 250, 252];
    const COR_FOOTER   = [148, 163, 184];
    const COR_HEADER_S = [230, 242, 247];

    function fmtPct(v) {
        if (!Number.isFinite(v)) return '—';
        return v.toFixed(1).replace('.', ',') + '%';
    }
    function corPorValor(v) { return v >= 0 ? COR_SUCCESS : COR_DANGER; }
    function fmtDataBR(iso) {
        if (!iso) return '—';
        const p = iso.split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
    }
    function fmtPayoff(v) {
        if (v === Infinity) return '∞';
        if (!Number.isFinite(v)) return '—';
        return v.toFixed(2).replace('.', ',');
    }
    function fmtMesCurto(iso) {
        if (!iso) return '—';
        const p = iso.split('-');
        if (p.length !== 2) return iso;
        const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const m = parseInt(p[1], 10) - 1;
        return nomes[m] + '/' + p[0];
    }

    function destruirGraficos() {
        [chartLine, chartPie, chartEquity].forEach(function (c) {
            if (c) { try { c.destroy(); } catch (e) {} }
        });
        chartLine = chartPie = chartEquity = null;
    }

    function carregarImagemBase64(url) {
        return new Promise(function (resolve) {
            try {
                const img = new Image();
                img.onload = function () {
                    try {
                        const c = document.createElement('canvas');
                        c.width = img.naturalWidth; c.height = img.naturalHeight;
                        c.getContext('2d').drawImage(img, 0, 0);
                        resolve(c.toDataURL('image/png'));
                    } catch (e) { resolve(null); }
                };
                img.onerror = function () { resolve(null); };
                img.src = url;
            } catch (e) { resolve(null); }
        });
    }

    function capturarCanvasComFundo(id) {
        return new Promise(function (resolve) {
            const canvas = document.getElementById(id);
            if (!canvas || canvas.width < 10 || canvas.height < 10) return resolve(null);
            try {
                const tmp = document.createElement('canvas');
                tmp.width = canvas.width; tmp.height = canvas.height;
                const ctx = tmp.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, tmp.width, tmp.height);
                ctx.drawImage(canvas, 0, 0);
                resolve(tmp.toDataURL('image/png', 1.0));
            } catch (e) { resolve(null); }
        });
    }

    function calcularDimensoesGrafico(prop, maxW, maxH) {
        const ar = prop.width / prop.height;
        let w = maxW; let h = w / ar;
        if (h > maxH) { h = maxH; w = h * ar; }
        return { w: w, h: h };
    }

    function desenharHeaderPDF(pdf, titulo, dataGeracao, logoBase64) {
        const pageW = pdf.internal.pageSize.getWidth();
        const margin = PDF_MARGEM_MM;
        pdf.setFillColor.apply(pdf, COR_PRIMARY);
        pdf.rect(0, 0, pageW, PDF_HEADER_ALTURA, 'F');
        if (logoBase64) {
            try { pdf.addImage(logoBase64, 'PNG', margin, 5, 15, 15); } catch (e) {}
        }
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.text('Relatório Gerencial — Planix TraderMax', margin + 18, 12);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(titulo, margin + 18, 18);
        pdf.setFontSize(7);
        pdf.text('Gerado em ' + dataGeracao, pageW - margin, 12, { align: 'right' });
    }

    function desenharFooterPDF(pdf, pageNum, totalPages) {
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = PDF_MARGEM_MM;
        pdf.setDrawColor.apply(pdf, COR_BORDER);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageH - PDF_FOOTER_ALTURA, pageW - margin, pageH - PDF_FOOTER_ALTURA);
        pdf.setTextColor.apply(pdf, COR_FOOTER);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text('Planix TraderMax', margin, pageH - 8);
        pdf.text('Página ' + pageNum + ' de ' + totalPages, pageW - margin, pageH - 8, { align: 'right' });
    }

    function desenharKPI(pdf, x, y, w, h, label, value, cor, sublabel) {
        pdf.setDrawColor.apply(pdf, COR_BORDER);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(x, y, w, h, 2, 2, 'S');
        pdf.setTextColor.apply(pdf, COR_MUTED);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.text(label.toUpperCase(), x + w / 2, y + 4.5, { align: 'center' });
        pdf.setTextColor.apply(pdf, cor);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(sublabel ? 9 : 11);
        pdf.text(value, x + w / 2, y + 11, { align: 'center' });
        if (sublabel) {
            pdf.setTextColor.apply(pdf, COR_MUTED);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.text(sublabel, x + w / 2, y + 15.5, { align: 'center' });
        }
    }

    async function exportarPDF() {
        try {
            if (typeof global.jspdf === 'undefined') {
                alert('Biblioteca PDF não carregada.');
                return;
            }
            const jsPDF = global.jspdf.jsPDF;
            const pdf = new jsPDF('p', 'mm', 'a4');
            if (typeof pdf.autoTable !== 'function') {
                alert('Biblioteca de tabela PDF não carregada.');
                return;
            }

            const s = state().getAll();
            const dados = calc().gerar(s.viewingYear, s.currentMonth);
            const kpis = dados.kpis;
            const perf = dados.performance;
            const f = format().fmt;

            const logoBase64 = await carregarImagemBase64('assets/logo.png');
            const imgLine   = await capturarCanvasComFundo('chart-rep-line');
            const imgPie    = await capturarCanvasComFundo('chart-rep-pie');
            const imgEquity = await capturarCanvasComFundo('chart-rep-equity');

            const agora = new Date();
            const dataGeracao = agora.toLocaleString('pt-BR');

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = PDF_MARGEM_MM;
            const contentW = pageW - margin * 2;

            desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
            let y = PDF_HEADER_ALTURA + 6;

            /* Resumo — 3 linhas de 3 KPIs */
            pdf.setTextColor.apply(pdf, COR_MUTED);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.text('RESUMO DO PERÍODO', margin, y);
            y += 3;

            const gap = 3;
            const kpiW = (contentW - gap * 2) / 3;
            const kpiH = 18;

            const linha1 = [
                ['Valor Bruto', f(kpis.liqPeriodo), corPorValor(kpis.liqPeriodo)],
                ['Valor Líquido', f(kpis.liqFinal), corPorValor(kpis.liqFinal)],
                ['Ganho de Capital', fmtPct(kpis.ganhoPct), corPorValor(kpis.ganhoPct)]
            ];
            linha1.forEach(function (k, i) {
                desenharKPI(pdf, margin + (kpiW + gap) * i, y, kpiW, kpiH, k[0], k[1], k[2]);
            });
            y += kpiH + 4;

            const linha2 = [
                ['DARF', f(kpis.darf), COR_DANGER],
                ['Prejuízo a Compensar', f(kpis.prejuizoCompensar), COR_MUTED],
                ['IRRF Retido', f(kpis.irrf), COR_MUTED]
            ];
            linha2.forEach(function (k, i) {
                desenharKPI(pdf, margin + (kpiW + gap) * i, y, kpiW, kpiH, k[0], k[1], k[2]);
            });
            y += kpiH + 4;

            const linha3 = [
                ['Custos Operacionais', f(kpis.custos), COR_MUTED],
                ['Capital Estimado', f(kpis.capitalEstimado), corPorValor(kpis.capitalEstimado)],
                ['Total Aportado', f(kpis.totalAportado), COR_MUTED]
            ];
            linha3.forEach(function (k, i) {
                desenharKPI(pdf, margin + (kpiW + gap) * i, y, kpiW, kpiH, k[0], k[1], k[2]);
            });
            y += kpiH + 6;

            /* Análise */
            pdf.setTextColor.apply(pdf, COR_MUTED);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.text('ANÁLISE', margin, y);
            y += 3;

            pdf.setTextColor.apply(pdf, COR_TEXT);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            const linhasAnalise = pdf.splitTextToSize(dados.analise, contentW);
            pdf.text(linhasAnalise, margin, y + 4);
            y += 4 + linhasAnalise.length * 4 + 4;

            /* Gráficos */
            if (imgLine || imgPie) {
                if (y > pageH - PDF_FOOTER_ALTURA - PDF_MAX_CHART_H - 15) {
                    pdf.addPage();
                    desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
                    y = PDF_HEADER_ALTURA + 6;
                }
                pdf.setTextColor.apply(pdf, COR_MUTED);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.text('GRÁFICOS', margin, y);
                y += 3;

                const gapChart = 4;
                const chartW = (contentW - gapChart) / 2;
                const dimLine = imgLine ? calcularDimensoesGrafico(pdf.getImageProperties(imgLine), chartW, PDF_MAX_CHART_H) : { w: 0, h: 0 };
                const dimPie  = imgPie  ? calcularDimensoesGrafico(pdf.getImageProperties(imgPie),  chartW, PDF_MAX_CHART_H) : { w: 0, h: 0 };
                const rowH = Math.max(dimLine.h, dimPie.h);

                if (imgLine) pdf.addImage(imgLine, 'PNG', margin + (chartW - dimLine.w) / 2, y, dimLine.w, dimLine.h);
                if (imgPie)  pdf.addImage(imgPie,  'PNG', margin + chartW + gapChart + (chartW - dimPie.w) / 2, y, dimPie.w, dimPie.h);
                y += rowH + 6;
            }

            /* Operações */
            if (dados.operacoes.length > 0) {
                pdf.addPage();
                desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
                y = PDF_HEADER_ALTURA + 6;

                pdf.setTextColor.apply(pdf, COR_MUTED);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.text('OPERAÇÕES', margin, y);
                y += 3;

                const bodyOps = dados.operacoes.map(function (o) {
                    return [
                        fmtDataBR(o.data),
                        o.resultado,
                        f(o.bruto),
                        f(o.taxaRegistro + o.taxasBmf),
                        f(o.irrf),
                        f(o.liquido)
                    ];
                });

                pdf.autoTable({
                    startY: y,
                    head: [['Data', 'Resultado', 'Bruto', 'Custos', 'IRRF', 'Líquido']],
                    body: bodyOps,
                    margin: { left: margin, right: margin },
                    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8,
                              lineColor: COR_BORDER, lineWidth: 0.1, textColor: COR_TEXT },
                    headStyles: { fillColor: COR_PRIMARY, textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: COR_STRIPE },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 22 },
                        1: { halign: 'center', cellWidth: 22 },
                        2: { halign: 'right' }, 3: { halign: 'right' },
                        4: { halign: 'right' }, 5: { halign: 'right' }
                    },
                    didDrawPage: function () {
                        const pn = pdf.internal.getCurrentPageInfo().pageNumber;
                        if (pn > 1) desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
                    }
                });
            }

            /* Movimentações */
            if (dados.aportes.length > 0 || dados.saques.length > 0) {
                pdf.addPage();
                desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
                y = PDF_HEADER_ALTURA + 6;

                pdf.setTextColor.apply(pdf, COR_MUTED);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.text('MOVIMENTAÇÕES', margin, y);
                y += 3;

                if (dados.aportes.length > 0) {
                    pdf.setTextColor.apply(pdf, COR_TEXT);
                    pdf.setFontSize(7);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Aportes', margin, y + 2);
                    y += 3;
                    const bodyA = dados.aportes.map(function (a) { return [fmtDataBR(a.data), f(a.valor)]; });
                    const totalA = dados.aportes.reduce(function (sum, a) { return sum + a.valor; }, 0);
                    pdf.autoTable({
                        startY: y,
                        head: [['Data', 'Valor']],
                        body: bodyA,
                        foot: [['Total', f(totalA)]],
                        margin: { left: margin, right: margin },
                        styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.6,
                                  lineColor: COR_BORDER, lineWidth: 0.1, textColor: COR_TEXT },
                        headStyles: { fillColor: COR_PRIMARY, textColor: 255, fontStyle: 'bold' },
                        footStyles: { fillColor: COR_HEADER_S, textColor: COR_TEXT, fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: COR_STRIPE },
                        columnStyles: { 0: { halign: 'center', cellWidth: 30 }, 1: { halign: 'right' } }
                    });
                    y = pdf.lastAutoTable.finalY + 6;
                }

                if (dados.saques.length > 0) {
                    pdf.setTextColor.apply(pdf, COR_TEXT);
                    pdf.setFontSize(7);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Saques', margin, y + 2);
                    y += 3;
                    const bodyS = dados.saques.map(function (sq) { return [fmtDataBR(sq.data), f(sq.valor)]; });
                    const totalS = dados.saques.reduce(function (sum, sq) { return sum + sq.valor; }, 0);
                    pdf.autoTable({
                        startY: y,
                        head: [['Data', 'Valor']],
                        body: bodyS,
                        foot: [['Total', f(totalS)]],
                        margin: { left: margin, right: margin },
                        styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.6,
                                  lineColor: COR_BORDER, lineWidth: 0.1, textColor: COR_TEXT },
                        headStyles: { fillColor: COR_PRIMARY, textColor: 255, fontStyle: 'bold' },
                        footStyles: { fillColor: COR_HEADER_S, textColor: COR_TEXT, fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: COR_STRIPE },
                        columnStyles: { 0: { halign: 'center', cellWidth: 30 }, 1: { halign: 'right' } }
                    });
                }
            }

            /* Performance */
            if (!perf.empty) {
                pdf.addPage();
                desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
                y = PDF_HEADER_ALTURA + 6;

                pdf.setTextColor.apply(pdf, COR_MUTED);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.text('PERFORMANCE', margin, y);
                y += 3;

                const kpiWP = (contentW - gap * 2) / 3;
                const kpiHP = 18;
                const perfLinhas = [
                    [['Taxa de Acerto', fmtPct(perf.taxaAcerto), COR_MUTED],
                     ['Payoff', fmtPayoff(perf.payoff), COR_MUTED],
                     ['Expectativa', f(Math.round(perf.expectativa)), corPorValor(perf.expectativa)]],
                    [['Drawdown Máximo', f(perf.maxDrawdown), COR_DANGER],
                     ['Máx Seq Perdas', String(perf.maxSeqPerda), COR_DANGER],
                     ['Máx Seq Ganhos', String(perf.maxSeqGanho), COR_SUCCESS]],
                    [['Melhor Dia', fmtDataBR(perf.melhorDia.data), COR_SUCCESS],
                     ['Pior Dia', fmtDataBR(perf.piorDia.data), COR_DANGER],
                     ['Melhor Mês', fmtMesCurto(perf.melhorMes.mes), COR_SUCCESS]]
                ];
                perfLinhas.forEach(function (linha) {
                    linha.forEach(function (k, i) {
                        desenharKPI(pdf, margin + (kpiWP + gap) * i, y, kpiWP, kpiHP, k[0], k[1], k[2]);
                    });
                    y += kpiHP + 4;
                });
                y += 4;

                if (imgEquity) {
                    if (y > pageH - PDF_FOOTER_ALTURA - 70) {
                        pdf.addPage();
                        desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
                        y = PDF_HEADER_ALTURA + 6;
                    }
                    pdf.setTextColor.apply(pdf, COR_MUTED);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(8);
                    pdf.text('CURVA DE CAPITAL', margin, y);
                    y += 3;
                    const dimE = calcularDimensoesGrafico(pdf.getImageProperties(imgEquity), contentW, 70);
                    pdf.addImage(imgEquity, 'PNG', margin + (contentW - dimE.w) / 2, y, dimE.w, dimE.h);
                    y += dimE.h + 4;
                }
            }

            /* DARF */
            pdf.addPage();
            desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
            y = PDF_HEADER_ALTURA + 6;

            pdf.setTextColor.apply(pdf, COR_MUTED);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.text('APURAÇÃO DE DARF — MÊS A MÊS', margin, y);
            y += 3;

            const bodyDarf = dados.darf.mensal.map(function (m) {
                return [
                    m.mesLabel,
                    f(m.lucroMensal),
                    f(m.prejuizoAcumulado),
                    f(m.lucroTributavel),
                    f(m.darf)
                ];
            });
            pdf.autoTable({
                startY: y,
                head: [['Mês', 'Resultado', 'Prejuízo Acum.', 'Tributável', 'DARF']],
                body: bodyDarf,
                foot: [['TOTAL', '', '', '', f(dados.darf.total)]],
                margin: { top: PDF_HEADER_ALTURA + 5, left: margin, right: margin,
                          bottom: PDF_FOOTER_ALTURA + 5 },
                styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8,
                          lineColor: COR_BORDER, lineWidth: 0.1, textColor: COR_TEXT },
                headStyles: { fillColor: COR_PRIMARY, textColor: 255, fontStyle: 'bold' },
                footStyles: { fillColor: COR_HEADER_S, textColor: COR_TEXT, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: COR_STRIPE },
                columnStyles: {
                    0: { cellWidth: 30, fontStyle: 'bold' },
                    1: { halign: 'right' }, 2: { halign: 'right' },
                    3: { halign: 'right' }, 4: { halign: 'right' }
                },
                didDrawPage: function () {
                    const pn = pdf.internal.getCurrentPageInfo().pageNumber;
                    if (pn > 1) desenharHeaderPDF(pdf, dados.periodo.label, dataGeracao, logoBase64);
                }
            });

            const total = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= total; i++) {
                pdf.setPage(i);
                desenharFooterPDF(pdf, i, total);
            }

            const nomeArq = 'relatorio-planix-tradermax-' +
                            dados.periodo.ano + '-' +
                            (dados.periodo.tipo === 'anual' ? 'anual' : String(dados.periodo.mes + 1).padStart(2, '0')) +
                            '.pdf';
            pdf.save(nomeArq);
        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            alert('Erro ao gerar PDF: ' + (err.message || 'desconhecido'));
        }
    }

    function exportarExcel() {
        try {
            if (!global.Planis.exportExcel) {
                alert('Módulo de Excel não carregado.');
                return;
            }
            const s = state().getAll();
            const dados = calc().gerar(s.viewingYear, s.currentMonth);
            const kpis = dados.kpis;
            const perf = dados.performance;
            const f = format().fmt;
            const titulo = 'Relatório Planix TraderMax — ' + dados.periodo.label;

            const resumo = [
                [titulo], [],
                ['RESUMO DO PERÍODO'],
                ['Indicador', 'Valor'],
                ['Valor Total de Negócios', f(kpis.totalBruto)],
                ['Valor Bruto (período)', f(kpis.liqPeriodo)],
                ['Valor Líquido (após DARF)', f(kpis.liqFinal)],
                ['Ganho de Capital (%)', fmtPct(kpis.ganhoPct)],
                ['DARF do Período', f(kpis.darf)],
                ['Prejuízo a Compensar', f(kpis.prejuizoCompensar)],
                ['IRRF Retido', f(kpis.irrf)],
                ['Custos Operacionais', f(kpis.custos)],
                ['Capital Estimado', f(kpis.capitalEstimado)],
                ['Total Aportado', f(kpis.totalAportado)],
                ['Saque Realizado', f(kpis.totalSaques)],
                [],
                ['ANÁLISE'],
                [dados.analise]
            ];

            const ops = [[titulo], [],
                ['Data', 'Resultado', 'Valor Bruto', 'Taxa Registro', 'Taxas BMF', 'IRRF', 'Valor Líquido']];
            dados.operacoes.forEach(function (o) {
                ops.push([
                    fmtDataBR(o.data), o.resultado,
                    f(o.bruto), f(o.taxaRegistro), f(o.taxasBmf), f(o.irrf), f(o.liquido)
                ]);
            });

            const movs = [[titulo], [], ['APORTES'], ['Data', 'Valor']];
            dados.aportes.forEach(function (a) { movs.push([fmtDataBR(a.data), f(a.valor)]); });
            movs.push(['Total', f(kpis.totalAportado)], [], ['SAQUES'], ['Data', 'Valor']);
            dados.saques.forEach(function (sq) { movs.push([fmtDataBR(sq.data), f(sq.valor)]); });
            movs.push(['Total', f(kpis.totalSaques)]);

            const perfArr = [[titulo], [],
                ['Indicador', 'Valor'],
                ['Total de Operações', perf.totalOps],
                ['Operações Positivas', perf.totalPos],
                ['Operações Negativas', perf.totalNeg],
                ['Taxa de Acerto', fmtPct(perf.taxaAcerto)],
                ['Ganho Médio', f(perf.ganhoMedio)],
                ['Perda Média', f(perf.perdaMedia)],
                ['Payoff', fmtPayoff(perf.payoff)],
                ['Expectativa Matemática', f(Math.round(perf.expectativa))],
                ['Drawdown Máximo', f(perf.maxDrawdown)],
                ['Máx Seq Perdas', perf.maxSeqPerda],
                ['Máx Seq Ganhos', perf.maxSeqGanho],
                ['Melhor Dia', fmtDataBR(perf.melhorDia.data)],
                ['Valor Melhor Dia', f(perf.melhorDia.lucroLiquidoCents)],
                ['Pior Dia', fmtDataBR(perf.piorDia.data)],
                ['Valor Pior Dia', f(perf.piorDia.lucroLiquidoCents)],
                ['Melhor Mês', fmtMesCurto(perf.melhorMes.mes)],
                ['Valor Melhor Mês', f(perf.melhorMes.valorCents)],
                ['Pior Mês', fmtMesCurto(perf.piorMes.mes)],
                ['Valor Pior Mês', f(perf.piorMes.valorCents)]
            ];

            const darfArr = [[titulo], [],
                ['Mês', 'Resultado', 'Prejuízo Acum.', 'Tributável', 'DARF']];
            dados.darf.mensal.forEach(function (m) {
                darfArr.push([
                    m.mesLabel,
                    f(m.lucroMensal), f(m.prejuizoAcumulado),
                    f(m.lucroTributavel), f(m.darf)
                ]);
            });
            darfArr.push(['TOTAL', '', '', '', f(dados.darf.total)]);

            const nomeArq = 'relatorio-planix-tradermax-' +
                            dados.periodo.ano + '-' +
                            (dados.periodo.tipo === 'anual' ? 'anual' : String(dados.periodo.mes + 1).padStart(2, '0')) +
                            '.xlsx';

            global.Planis.exportExcel.toExcelComAbas([
                { nome: 'Resumo',        linhas: resumo,  colWidths: [35, 22] },
                { nome: 'Operações',     linhas: ops,     colWidths: [12, 12, 16, 14, 14, 14, 16] },
                { nome: 'Movimentações', linhas: movs,    colWidths: [14, 18] },
                { nome: 'Performance',   linhas: perfArr, colWidths: [30, 22] },
                { nome: 'DARF',          linhas: darfArr, colWidths: [16, 18, 18, 18, 14] }
            ], nomeArq);
        } catch (err) {
            console.error('Erro ao gerar Excel:', err);
            alert('Erro ao gerar Excel: ' + (err.message || 'desconhecido'));
        }
    }

    function render(container) {
        destruirGraficos();

        const s = state().getAll();
        const dados = calc().gerar(s.viewingYear, s.currentMonth);
        const kpis = dados.kpis;
        const perf = dados.performance;
        const f = format().fmt;

        const liqClass = kpis.liqFinal >= 0 ? 'green' : 'red';
        const pctClass = kpis.ganhoPct >= 0 ? 'green' : 'red';

        container.innerHTML = [
            '<div class="panel" style="margin-bottom:1.5rem;">',
            '  <div class="panel-header" style="flex-wrap:wrap; gap:1rem;">',
            '    <div class="panel-title">Relatório Gerencial — ' + dados.periodo.label + '</div>',
            '    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">',
            '      <button id="btn-rep-pdf" class="btn btn-primary btn-sm" type="button">',
            '        <i class="fas fa-file-pdf"></i> Gerar PDF',
            '      </button>',
            '      <button id="btn-rep-excel" class="btn btn-primary btn-sm" type="button">',
            '        <i class="fas fa-file-excel"></i> Gerar Excel',
            '      </button>',
            '    </div>',
            '  </div>',
            '  <div class="panel-body">',
            '    <div class="cards-grid">',
            '      <div class="stat-card mint"><div class="stat-icon"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="stat-label">Valor Bruto</div><div class="stat-value">' + f(kpis.liqPeriodo) + '</div></div></div>',
            '      <div class="stat-card ' + liqClass + '"><div class="stat-icon"><i class="fas fa-wallet"></i></div><div class="stat-info"><div class="stat-label">Valor Líquido</div><div class="stat-value">' + f(kpis.liqFinal) + '</div><div class="stat-sub">Após DARF</div></div></div>',
            '      <div class="stat-card ' + pctClass + '"><div class="stat-icon"><i class="fas fa-percent"></i></div><div class="stat-info"><div class="stat-label">Ganho de Capital</div><div class="stat-value">' + kpis.ganhoPct.toFixed(2) + '%</div></div></div>',
            '      <div class="stat-card purple"><div class="stat-icon"><i class="fas fa-file-invoice"></i></div><div class="stat-info"><div class="stat-label">DARF</div><div class="stat-value">' + f(kpis.darf) + '</div></div></div>',
            '      <div class="stat-card orange"><div class="stat-icon"><i class="fas fa-shield-alt"></i></div><div class="stat-info"><div class="stat-label">Prejuízo a Compensar</div><div class="stat-value">' + f(kpis.prejuizoCompensar) + '</div></div></div>',
            '      <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-hand-holding-usd"></i></div><div class="stat-info"><div class="stat-label">IRRF Retido</div><div class="stat-value">' + f(kpis.irrf) + '</div></div></div>',
            '      <div class="stat-card orange"><div class="stat-icon"><i class="fas fa-calculator"></i></div><div class="stat-info"><div class="stat-label">Custos Operacionais</div><div class="stat-value">' + f(kpis.custos) + '</div></div></div>',
            '      <div class="stat-card mint"><div class="stat-icon"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-label">Capital Estimado</div><div class="stat-value">' + f(kpis.capitalEstimado) + '</div></div></div>',
            '      <div class="stat-card yellow"><div class="stat-icon"><i class="fas fa-donate"></i></div><div class="stat-info"><div class="stat-label">Total Aportado</div><div class="stat-value">' + f(kpis.totalAportado) + '</div></div></div>',
            '      <div class="stat-card red"><div class="stat-icon"><i class="fas fa-hand-holding-usd"></i></div><div class="stat-info"><div class="stat-label">Saque Realizado</div><div class="stat-value">' + f(kpis.totalSaques) + '</div></div></div>',
            '    </div>',
            '    <div style="margin-top:1.25rem; padding:1rem 1.25rem; background:var(--bg); border-radius:var(--radius); border-left:3px solid var(--primary);">',
            '      <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); margin-bottom:0.5rem;">Análise do Período</div>',
            '      <div style="font-size:0.875rem; color:var(--text); line-height:1.55;">' + dados.analise + '</div>',
            '    </div>',
            '  </div>',
            '</div>',

            '<div class="charts-row">',
            '  <div class="panel">',
            '    <div class="panel-header"><div class="panel-title">Valor Líquido por Operação</div></div>',
            '    <div class="panel-body"><canvas id="chart-rep-line"></canvas></div>',
            '  </div>',
            '  <div class="panel">',
            '    <div class="panel-header"><div class="panel-title">Positivas vs Negativas</div></div>',
            '    <div class="panel-body"><canvas id="chart-rep-pie"></canvas></div>',
            '  </div>',
            '</div>',

            (!perf.empty ? [
            '<div class="charts-row">',
            '  <div class="panel">',
            '    <div class="panel-header"><div class="panel-title">Curva de Capital</div></div>',
            '    <div class="panel-body"><canvas id="chart-rep-equity"></canvas></div>',
            '  </div>',
            '  <div class="panel">',
            '    <div class="panel-header"><div class="panel-title">Performance</div></div>',
            '    <div class="panel-body" style="padding:1.25rem;">',
            '      <div style="display:grid; gap:0.6rem; font-size:0.85rem;">',
            '        <div style="display:flex; justify-content:space-between;"><span>Taxa de Acerto</span><strong>' + fmtPct(perf.taxaAcerto) + '</strong></div>',
            '        <div style="display:flex; justify-content:space-between;"><span>Payoff</span><strong>' + fmtPayoff(perf.payoff) + '</strong></div>',
            '        <div style="display:flex; justify-content:space-between;"><span>Expectativa</span><strong>' + f(Math.round(perf.expectativa)) + '</strong></div>',
            '        <div style="display:flex; justify-content:space-between;"><span>Drawdown Máx.</span><strong>' + f(perf.maxDrawdown) + '</strong></div>',
            '        <div style="display:flex; justify-content:space-between;"><span>Máx. Seq. Perdas</span><strong>' + perf.maxSeqPerda + '</strong></div>',
            '        <div style="display:flex; justify-content:space-between;"><span>Máx. Seq. Ganhos</span><strong>' + perf.maxSeqGanho + '</strong></div>',
            '        <div style="display:flex; justify-content:space-between;"><span>Melhor Dia</span><strong>' + fmtDataBR(perf.melhorDia.data) + '</strong></div>',
            '        <div style="display:flex; justify-content:space-between;"><span>Pior Dia</span><strong>' + fmtDataBR(perf.piorDia.data) + '</strong></div>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'].join('') : ''),

            '<div class="panel">',
            '  <div class="panel-header"><div class="panel-title">Apuração de DARF — Mês a Mês</div></div>',
            '  <div class="table-responsive">',
            '    <table class="data-table">',
            '      <thead><tr><th>Mês</th><th style="text-align:right;">Resultado</th><th style="text-align:right;">Prejuízo Acum.</th><th style="text-align:right;">Tributável</th><th style="text-align:right;">DARF</th></tr></thead>',
            '      <tbody>' + dados.darf.mensal.map(function (m) {
                    return '<tr><td>' + m.mesLabel + '</td><td style="text-align:right;">' + f(m.lucroMensal) + '</td><td style="text-align:right;">' + f(m.prejuizoAcumulado) + '</td><td style="text-align:right;">' + f(m.lucroTributavel) + '</td><td style="text-align:right;">' + f(m.darf) + '</td></tr>';
                }).join('') + '</tbody>',
            '      <tfoot><tr style="background:var(--bg); font-weight:700;"><td>TOTAL</td><td></td><td></td><td></td><td style="text-align:right;">' + f(dados.darf.total) + '</td></tr></tfoot>',
            '    </table>',
            '  </div>',
            '</div>'
        ].join('');

        document.getElementById('btn-rep-pdf').addEventListener('click', exportarPDF);
        document.getElementById('btn-rep-excel').addEventListener('click', exportarExcel);

        requestAnimationFrame(function () {
            const ops = dados.operacoes;

            const canvasLine = document.getElementById('chart-rep-line');
            if (canvasLine && ops.length > 0) {
                chartLine = new global.Chart(canvasLine.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ops.map(function (o) { return fmtDataBR(o.data); }),
                        datasets: [{
                            label: 'Valor Líquido',
                            data: ops.map(function (o) { return o.liquido / 100; }),
                            borderColor: '#7FB3D5',
                            backgroundColor: 'rgba(127,179,213,0.15)',
                            fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(127,179,213,0.12)' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }

            const canvasPie = document.getElementById('chart-rep-pie');
            if (canvasPie && ops.length > 0) {
                const positivas = ops.filter(function (o) { return o.resultado === 'Positivo'; }).length;
                const negativas = ops.length - positivas;
                chartPie = new global.Chart(canvasPie.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Positivas', 'Negativas'],
                        datasets: [{
                            data: [positivas, negativas],
                            backgroundColor: ['#81C784', '#EF9A9A'],
                            borderColor: '#ffffff', borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: true, cutout: '60%',
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }

            const canvasEquity = document.getElementById('chart-rep-equity');
            if (canvasEquity && ops.length > 0) {
                let acum = 0;
                const eqData = ops.map(function (o) { acum += o.liquido; return acum / 100; });
                chartEquity = new global.Chart(canvasEquity.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ops.map(function (o) { return fmtDataBR(o.data); }),
                        datasets: [{
                            label: 'Capital Acumulado',
                            data: eqData,
                            borderColor: '#7FB3D5',
                            backgroundColor: 'rgba(127,179,213,0.15)',
                            fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(127,179,213,0.12)' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        });
    }

    global.Planis = global.Planis || {};
    global.Planis.reportsView = { render };
})(window);