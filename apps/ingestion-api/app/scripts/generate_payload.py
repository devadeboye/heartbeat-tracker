import os
import sys

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.domains.heartbeat.contracts import heartbeat_pb2
except ImportError:
    # If running inside the container/with specific PYTHONPATH
    from domains.heartbeat.contracts import heartbeat_pb2

hb = heartbeat_pb2.Heartbeat()
hb.device_id = "test-device-load"
hb.timestamp = 1710000000000
hb.battery_level = 95.0
hb.cpu_usage = 10.0
hb.firmware_version = "1.0.0-PROD"
hb.location.latitude = 6.5244
hb.location.longitude = 3.3792

output_path = '/tmp/heartbeat.bin'
with open(output_path, 'wb') as f:
    f.write(hb.SerializeToString())

print(f"Created {output_path}")
