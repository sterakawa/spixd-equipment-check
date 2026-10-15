# Sakura VPS Docker migration (test only)

This branch adapts Vercel's Node.js API handlers to a standalone Node.js HTTP server.
It keeps the existing Supabase database; no database migration is performed.

## Start on VPS
Clone this repository using a read-only deploy key with access to this repository.
Switch to branch `migration/sakura-vps-docker`.

```sh
cp .env.example .env
chmod 600 .env
# Edit .env on the VPS and provide required secrets. Never commit it.
sudo docker compose config --quiet
sudo docker compose up -d --build
curl -i http://127.0.0.1:8081/health
curl -I http://127.0.0.1:8081/
```

The service binds to 127.0.0.1:8081 on the VPS. It is not publicly reachable.
To inspect from your Mac, open an SSH tunnel:
`ssh -i ~/.ssh/qlcle_vps_admin -L 8081:127.0.0.1:8081 ubuntu@153.127.17.202`
Then visit http://localhost:8081/.

## Checks before public deployment
- Verify Supabase environment values and RLS, especially plan creation/read.
- Verify the management API with a real ADMIN_ACCESS_TOKEN and SERVICE_ROLE_KEY.
- Confirm that the Vercel cron /api/catalog can be removed or replaced: current endpoint fetches live data.
- Compare create/checklist flows against Vercel, including previously issued URLs.
- Put an HTTPS reverse proxy and access controls in front before external publication.
- Never place service-role keys or admin tokens in GitHub or public JavaScript.

## Stop
`sudo docker compose down`
