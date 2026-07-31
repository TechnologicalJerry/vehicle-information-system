import { ReportExporterEngine } from './report-exporter.engine';
import { ExportFormat, ReportType } from '@app/common';

describe('ReportExporterEngine', () => {
  let engine: ReportExporterEngine;

  beforeEach(() => {
    engine = new ReportExporterEngine();
  });

  it('should export CSV buffer correctly', async () => {
    const data = [
      { id: '1', name: 'Fleet A', status: 'ACTIVE' },
      { id: '2', name: 'Fleet B', status: 'INACTIVE' },
    ];

    const result = await engine.generateExportBuffer(ReportType.FLEET, ExportFormat.CSV, data);

    expect(result.mimeType).toBe('text/csv');
    expect(result.filename).toContain('fleet_report_');
    const content = result.buffer.toString('utf-8');
    expect(content).toContain('id,name,status');
    expect(content).toContain('"Fleet A"');
  });

  it('should export JSON buffer correctly', async () => {
    const data = [{ id: '1', name: 'Vehicle 1' }];

    const result = await engine.generateExportBuffer(ReportType.VEHICLE, ExportFormat.JSON, data);

    expect(result.mimeType).toBe('application/json');
    const content = JSON.parse(result.buffer.toString('utf-8'));
    expect(content[0].name).toBe('Vehicle 1');
  });
});
