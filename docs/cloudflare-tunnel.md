# Cloudflare Tunnel Setup for Windows

This guide explains how to expose the Docker container securely via Cloudflare Tunnel without opening inbound ports on your router.

## 1. Install `cloudflared`
Download the Windows executable from [Cloudflare's official releases](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
Save it to a permanent location, e.g., `C:\Cloudflared\cloudflared.exe`.
Add that directory to your Windows PATH if desired.

## 2. Authenticate and Create Tunnel
Open a PowerShell terminal as Administrator:
```powershell
cloudflared tunnel login
```
This will open a browser window. Select the `example.org` zone.

Create the tunnel:
```powershell
cloudflared tunnel create bic-pptx
```
This generates a credentials file in `%USERPROFILE%\.cloudflared\`. **Do not commit this file to git.**

## 3. Configure Ingress Rules
Create a configuration file at `%USERPROFILE%\.cloudflared\config.yml` with the following content:
```yaml
tunnel: bic-pptx
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: presenter.example.org
    service: http://127.0.0.1:3000
  - service: http_status:404
```
*(Replace `YOUR_USERNAME` and `<TUNNEL_ID>` with your actual values)*

## 4. Install as a Windows Service
To ensure the tunnel survives reboots and does not require an open terminal:
```powershell
cloudflared service install
```
Start the service:
```powershell
Start-Service cloudflared
```
You can verify it is running via the Windows Services app (`services.msc`).

## 5. Route DNS
Route traffic for the hostname to the tunnel:
```powershell
cloudflared tunnel route dns bic-pptx presenter.example.org
```
Alternatively, do this manually in the Cloudflare Dashboard by adding a CNAME record for `admin` pointing to `<TUNNEL_ID>.cfargotunnel.com`.

## 6. Verify Reachability
Navigate to `https://presenter.example.org` in a web browser. It should securely route to the Next.js container (e.g., reaching the `/login` page).

## 7. Webhook Configuration
With the tunnel running, external services like `picoclaw` (running on your VPS) can now communicate with the app via the public URL.
Configure picoclaw to post to:
`https://presenter.example.org/api/webhook`
See [picoclaw-webhook.md](./picoclaw-webhook.md) for payload documentation.
