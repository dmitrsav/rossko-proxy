# Простая связка Nginx + PHP-FPM (Alpine)
FROM php:8.2-fpm-alpine

# Устанавливаем nginx и нужные расширения PHP
RUN apk add --no-cache nginx curl &&         docker-php-ext-install -j$(nproc) pcntl

# Рабочая директория
WORKDIR /var/www/html

# Копируем PHP мост
COPY rossko_bridge.php /var/www/html/rossko_bridge.php

# Мини-страница по умолчанию
RUN printf "<?php echo 'OK';" > /var/www/html/index.php

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Права
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

# Стартуем php-fpm в форграунде и nginx в форграунде
CMD sh -c "php-fpm -F & nginx -g 'daemon off;'"
