import csv
import time
import requests
from datetime import datetime

def send_packages(csv_path):
    # Group packages by timestamp
    packages_by_ts = {}
    
    with open(csv_path, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            ts = int(row['Timestamp'])
            package = {
                'ip': row['ip address'],
                'latitude': float(row['Latitude']),
                'longitude': float(row['Longitude']),
                'timestamp': ts,
                'suspicious': int(float(row['suspicious']))
            }
            if ts not in packages_by_ts:
                packages_by_ts[ts] = []
            packages_by_ts[ts].append(package)
    
    # Process timestamps in chronological order
    sorted_timestamps = sorted(packages_by_ts.keys())
    prev_time = None
    
    for ts in sorted_timestamps:
        current_time = datetime.fromtimestamp(ts)
        
        # Calculate delay from previous batch
        if prev_time is not None:
            delay = (current_time - prev_time).total_seconds()
            time.sleep(max(delay, 0))
        
        # Send entire batch for this timestamp
        try:
            # In sender.py, change:
            response = requests.post('http://backend:5000/package', json=packages_by_ts[ts])
            print(f"Sent {len(packages_by_ts[ts])} packages for {current_time} {response.status_code}")
        except Exception as e:
            print(f"Error sending batch: {e}")
        
        prev_time = current_time

if __name__ == '__main__':
    send_packages('data/ip_addresses.csv')
