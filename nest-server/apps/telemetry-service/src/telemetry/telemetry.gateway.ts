import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'telemetry',
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TelemetryGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket Client Connected: [id=${client.id}]`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket Client Disconnected: [id=${client.id}]`);
  }

  @SubscribeMessage('subscribe_vehicle')
  handleSubscribeVehicle(
    @MessageBody() data: { vehicleId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.vehicleId) {
      const room = `vehicle:${data.vehicleId}`;
      client.join(room);
      this.logger.log(`Client [${client.id}] joined room [${room}]`);
      return { status: 'joined', room };
    }
  }

  @SubscribeMessage('unsubscribe_vehicle')
  handleUnsubscribeVehicle(
    @MessageBody() data: { vehicleId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.vehicleId) {
      const room = `vehicle:${data.vehicleId}`;
      client.leave(room);
      this.logger.log(`Client [${client.id}] left room [${room}]`);
      return { status: 'left', room };
    }
  }

  @SubscribeMessage('subscribe_fleet')
  handleSubscribeFleet(
    @MessageBody() data: { fleetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.fleetId) {
      const room = `fleet:${data.fleetId}`;
      client.join(room);
      this.logger.log(`Client [${client.id}] joined room [${room}]`);
      return { status: 'joined', room };
    }
  }

  broadcastTelemetry(data: any) {
    if (!this.server) return;

    // Broadcast to vehicle specific room
    if (data.vehicleId) {
      this.server.to(`vehicle:${data.vehicleId}`).emit('telemetry_update', data);
    }

    // Broadcast to fleet specific room
    if (data.fleetId) {
      this.server.to(`fleet:${data.fleetId}`).emit('fleet_telemetry_update', data);
    }

    // Global feed broadcast
    this.server.emit('global_telemetry', data);
  }
}
