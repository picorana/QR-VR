qr-vr

use flask:
1) export FLASK_APP=test.py 	# define the starting point for flask
2) export FLASK_DEBUG=1		# this means that flask will reset what is being served every time you modify a file
3) flask run --host:0.0.0.0	# the host part means that the file will be served on all devices on the same wifi.

ip to connect to is:
your.subnet.ip:5000?map_id=1

map_id value can be changed according to what you need
map_id=2 is the ISS
defaults to map_id=0 
