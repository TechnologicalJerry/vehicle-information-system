import { GeofencesService } from './geofences.service';
import { GeofenceRepository, PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';

describe('GeofencesService Spatial Math', () => {
  let service: GeofencesService;

  beforeEach(() => {
    service = new GeofencesService(
      {} as GeofenceRepository,
      {} as PrismaService,
      {} as RedisService,
      {} as KafkaProducerService,
    );
  });

  it('should detect point inside circle', () => {
    const centerLat = 37.7749;
    const centerLng = -122.4194;
    const radiusMeters = 1000; // 1 km

    // Point 100 meters away
    const testLat = 37.775;
    const testLng = -122.4194;

    const isInside = service.isPointInCircle(testLat, testLng, centerLat, centerLng, radiusMeters);
    expect(isInside).toBe(true);
  });

  it('should detect point outside circle', () => {
    const centerLat = 37.7749;
    const centerLng = -122.4194;
    const radiusMeters = 500; // 500 meters

    // Point ~10 km away
    const testLat = 37.85;
    const testLng = -122.4194;

    const isInside = service.isPointInCircle(testLat, testLng, centerLat, centerLng, radiusMeters);
    expect(isInside).toBe(false);
  });

  it('should detect point inside polygon ring using ray-casting', () => {
    const ring = [
      [-122.42, 37.77],
      [-122.41, 37.77],
      [-122.41, 37.78],
      [-122.42, 37.78],
      [-122.42, 37.77],
    ];

    const testLat = 37.775;
    const testLng = -122.415;

    const isInside = service.isPointInPolygon(testLat, testLng, ring);
    expect(isInside).toBe(true);
  });

  it('should detect point outside polygon ring', () => {
    const ring = [
      [-122.42, 37.77],
      [-122.41, 37.77],
      [-122.41, 37.78],
      [-122.42, 37.78],
      [-122.42, 37.77],
    ];

    const testLat = 37.85;
    const testLng = -122.415;

    const isInside = service.isPointInPolygon(testLat, testLng, ring);
    expect(isInside).toBe(false);
  });
});
