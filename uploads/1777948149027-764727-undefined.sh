#!/bin/bash

find /home/nixos/Documents/temp/ -type f -size +10M | while read file
do
    echo "$(basename "$file") $(du -h "$file" | cut -f1)"
    mail -s "You have too large file: $file - $(du -h "$file" | cut -f1)" "$(stat -c '%U' "$file")@gmail.com"
done
