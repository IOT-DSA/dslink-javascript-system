var DS = require('dslink'),
	os = require('os'),
	df = require('node-diskfree'),
	cla = require('command-line-args'),
	provider = new DS.NodeProvider(),
	gbToBytes = 1024 * 1024 * 1024,
	responder,
	cli = cla([
				{ name: "help", type: Boolean, defaultOption: true},
    			{ name: "host", type: String, alias: "h", description: "The host you want the dslink to connect to" },
			    { name: "interval", type: Number, alias: "i", description: "How often (in milliseconds) you want to update metrics. Default: 5000"},
			    { name: "name", type: String, alias: "n", description: "The name of the dslink. Default: os-dslink"}
	]),
	args = cli.parse(),
	host = args.host,
	linkName = args.name || 'os-dslink',
	pollerInterval = args.interval || 5000;

	if (args.help) {
		return console.log(cli.getUsage({
			header: "DS Link for system metrics.",
		    footer: "For more information, visit http://github.com/IOT-DSA/os-dslink"
		}));
	}

	if (!host) {
		return console.error('You must specify a host to connect to. IE: node index.js -h http://localhost:8080');
	}


var updateMetrics = function () {
	provider.getNode('/arch').value = new DS.Value(os.arch());
	provider.getNode('/platform').value = new DS.Value(os.platform());
	provider.getNode('/uptime').value = new DS.Value(os.uptime());
	provider.getNode('/os').value = new DS.Value(os.type());
	updateCPUStats();
	updateDiskStats();
	updateMemoryStats();
};

var updateMemoryStats = function () {
	//memory
	provider.getNode('/memory/free').value = new DS.Value(os.freemem());
	provider.getNode('/memory/total').value = new DS.Value(os.totalmem());
	provider.getNode('/memory/usage').value = new DS.Value(Math.floor(100 - (os.freemem() / os.totalmem() * 100)));
};

var updateDiskStats = function () {
	//disks
	df.drives(function (err, drives) {
        if (err) {
            return console.log(err);
        }
        
        /* retrieve space information for each drives */
        df.drivesDetail(drives, function (err, data) {
            if (err) {
                return console.log(err);
            }
            for (var i = 0; i < data.length; i++) {
            	var node,
            		disk = data[i];
	            try {
	            	node = provider.getNode('/disks/disk' + i);
					provider.getNode('/disks/disk' + i + '/drive').value = new DS.Value(disk.drive);
					provider.getNode('/disks/disk' + i + '/used').value = new DS.Value(Math.floor(parseFloat(disk.used) * gbToBytes));
					provider.getNode('/disks/disk' + i + '/available').value = new DS.Value(Math.floor(parseFloat(disk.available) * gbToBytes));
					provider.getNode('/disks/disk' + i + '/total').value = new DS.Value(Math.floor(parseFloat(disk.total) * gbToBytes));
	            } catch (e) {
	            	node = provider.addNode('/disks/disk' + i);
	            	node.load({
	            		drive: {
	            			'$type': 'string',
	            			'?value': new DS.Value(disk.drive)
	            		},
	            		used: {
	            			'$type': 'number',
	            			'?value': new DS.Value(Math.floor(parseFloat(disk.used) * gbToBytes))
	            		},
	            		available: {
	            			'$type': 'number',
	            			'?value': new DS.Value(Math.floor(parseFloat(disk.available) * gbToBytes))
	            		},
	            		total: {
	            			'$type': 'number',
	            			'?value': new DS.Value(Math.floor(parseFloat(disk.total) * gbToBytes))
	            		}
	            	});
	            }
	        }
        });
    });
};


var updateCPUStats = function () {
	//cpus
	provider.getNode('/cpus/load').value = new DS.Value(os.loadavg()[0]);

	var cpus = os.cpus(),
		i, cpu, node;
	for (i = 0; i < cpus.length; i++) {
		cpu = cpus[i];
		node;
		try {
			node = provider.getNode('/cpus/cpu' + i);
			provider.getNode('/cpus/cpu' + i + '/model').value = new DS.Value(cpu.model);
			provider.getNode('/cpus/cpu' + i + '/speed').value = new DS.Value(cpu.speed);
			provider.getNode('/cpus/cpu' + i + '/times/user').value = new DS.Value(cpu.times.user);
			provider.getNode('/cpus/cpu' + i + '/times/sys').value = new DS.Value(cpu.times.sys);
			provider.getNode('/cpus/cpu' + i + '/times/idle').value = new DS.Value(cpu.times.idle);
			provider.getNode('/cpus/cpu' + i + '/times/nice').value = new DS.Value(cpu.times.nice);
			provider.getNode('/cpus/cpu' + i + '/times/irq').value = new DS.Value(cpu.times.irq);
		} catch (e) {
			node = provider.addNode('/cpus/cpu' + i);
			node.load({
				model: {
					'$type': 'string',
					'?value': new DS.Value(cpu.model)
				},
				speed: {
					'$type': 'number',
					'?value': new DS.Value(cpu.speed)
				},
				times: {
					user: {
						'$type': 'number',
						'?value': new DS.Value(cpu.times.user)
					},
					sys: {
						'$type': 'number',
						'?value': new DS.Value(cpu.times.sys)
					},
					idle: {
						'$type': 'number',
						'?value': new DS.Value(cpu.times.idle)
					},
					nice: {
						'$type': 'number',
						'?value': new DS.Value(cpu.times.nice)
					},
					irq: {
						'$type': 'number',
						'?value': new DS.Value(cpu.times.irq)
					}
				}
			});
		}
	}
};


provider.root.load({
	arch: {
		'$type': 'string',
		'?value': ''
	},
	os: {
		'$type': 'string',
		'?value': ''
	},
	platform: {
		'$type': 'string',
		'?value': ''
	},
	uptime: {
		'$type': 'number',
		'?value': 0
	},
	memory: {
		free: {
			'$type': 'number',
			'?value': 0
		},
		total: {
			'$type': 'number',
			'?value': 0
		},
		usage: {
			'$type': 'number',
			'?value': 0
		}
	},
	disks: {},
	cpus: {
		load: {
			'$type': 'number',
			'?value': 0
		}
	}
});

responder = new DS.Responder(new DS.WebSocketClient(linkName, host), provider);

setInterval(function () {
	updateMetrics();
}, pollerInterval);
updateMetrics();