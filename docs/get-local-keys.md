# Getting Local Keys

To control Tuya devices locally you need two values per device:

- **Device ID** — unique identifier for the device
- **Local Key** — encryption key used for LAN communication

These are obtained from the Tuya IoT Platform.

## Step 1: Create a Tuya IoT Account

1. Go to the [Tuya IoT Platform](https://iot.tuya.com/) and create an account.
2. Create a Cloud Project:
   - Select **Smart Home** as the industry.
   - Choose your data center region.
   - Under **API Services**, enable **IoT Core** and **Authorization Token Management**.
3. Link your Tuya/Smart Life app account under **Devices** > **Link Tuya App Account**.

## Step 2: Get Device IDs and Local Keys

### Option A: Tuya IoT Platform (Web)

Once your devices are linked to your cloud project:

1. Go to **Devices** > **All Devices**.
2. Each device shows its **Device ID**.
3. Click a device to view its **Local Key** in the device details.

### Option B: Using `tinytuya`

[tinytuya](https://github.com/jasonacox/tinytuya) is a popular Python tool that can scan your network and extract keys.

```bash
pip install tinytuya
python -m tinytuya wizard
```

The wizard will prompt for your Tuya IoT API credentials and list all devices with their IDs, keys, and IP addresses.

### Option C: Using `tuya-cli`

```bash
npm install -g @tuyapi/cli
tuya-cli wizard
```

The wizard prompts for your Tuya IoT API Key, Secret, and region, then lists device names, IDs, and local keys.

## Step 3: Add to Configuration

Use the obtained values in your Homebridge `config.json`:

```json
{
  "name": "My Device",
  "type": "SimpleLight",
  "id": "<Device ID from above>",
  "key": "<Local Key from above>"
}
```

::: warning
Local keys can change when a device is re-paired or its firmware is updated. If a device stops responding, re-extract its local key.
:::
