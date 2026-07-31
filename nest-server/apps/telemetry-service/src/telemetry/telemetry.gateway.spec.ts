import { TelemetryGateway } from './telemetry.gateway';
import { Socket } from 'socket.io';

describe('TelemetryGateway', () => {
  let gateway: TelemetryGateway;
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    gateway = new TelemetryGateway();
    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
    };
  });

  it('should handle vehicle room subscription', () => {
    const response = gateway.handleSubscribeVehicle({ vehicleId: 'veh-123' }, mockSocket as Socket);

    expect(mockSocket.join).toHaveBeenCalledWith('vehicle:veh-123');
    expect(response).toEqual({ status: 'joined', room: 'vehicle:veh-123' });
  });

  it('should handle vehicle room unsubscription', () => {
    const response = gateway.handleUnsubscribeVehicle(
      { vehicleId: 'veh-123' },
      mockSocket as Socket,
    );

    expect(mockSocket.leave).toHaveBeenCalledWith('vehicle:veh-123');
    expect(response).toEqual({ status: 'left', room: 'vehicle:veh-123' });
  });

  it('should handle fleet room subscription', () => {
    const response = gateway.handleSubscribeFleet({ fleetId: 'fleet-456' }, mockSocket as Socket);

    expect(mockSocket.join).toHaveBeenCalledWith('fleet:fleet-456');
    expect(response).toEqual({ status: 'joined', room: 'fleet:fleet-456' });
  });
});
