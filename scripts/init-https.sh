#!/bin/bash
set -e

DOMAIN="srmc-pos.vieerr.xyz"
EMAIL="olivier.paspuel@gmail.com"

echo "=== Installing Nginx and Certbot ==="
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "=== Creating Nginx config for reverse proxy ==="
cat > /tmp/nginx-config << 'EOF'
server {
    listen 80;
    server_name srmc-pos.vieerr.xyz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo tee /etc/nginx/sites-available/srmc-pos > /dev/null < /tmp/nginx-config
sudo ln -sf /etc/nginx/sites-available/srmc-pos /etc/nginx/sites-enabled/srmc-pos
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "=== Setting up SSL certificate ==="
sudo certbot certonly --nginx --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN" || echo "Certificate already exists or renewal skipped"

echo "=== Enabling HTTPS in Nginx ==="
cat > /tmp/nginx-https << 'EOF'
server {
    listen 80;
    server_name srmc-pos.vieerr.xyz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name srmc-pos.vieerr.xyz;

    ssl_certificate /etc/letsencrypt/live/srmc-pos.vieerr.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/srmc-pos.vieerr.xyz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo tee /etc/nginx/sites-available/srmc-pos > /dev/null < /tmp/nginx-https
sudo nginx -t
sudo systemctl restart nginx

echo "=== Setting up certbot renewal with systemd ==="
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "=== HTTPS Setup Complete ==="
echo "Domain: srmc-pos.vieerr.xyz"
echo "Visit: https://srmc-pos.vieerr.xyz"
