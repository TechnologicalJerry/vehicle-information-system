import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      notificationTemplate: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new TemplateService(prismaMock);
  });

  it('should render template variables correctly', async () => {
    const mockTemplate = {
      name: 'dtc_alert',
      subject: 'Alert: {{dtcCode}} detected',
      body: 'Vehicle {{vin}} reported {{title}}.',
      active: true,
    };

    prismaMock.notificationTemplate.findUnique.mockResolvedValue(mockTemplate);

    const rendered = await service.renderTemplate('dtc_alert', {
      dtcCode: 'P0217',
      vin: 'VIN-12345',
      title: 'Engine Coolant Over Temperature',
    });

    expect(rendered.subject).toBe('Alert: P0217 detected');
    expect(rendered.body).toBe('Vehicle VIN-12345 reported Engine Coolant Over Temperature.');
  });
});
