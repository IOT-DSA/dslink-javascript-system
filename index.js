var DS = require('dslink'),
	os = require('os'),
	df = require('node-diskfree'),
	provider = new DS.NodeProvider(),
	gbToBytes = 1024 * 1024 * 1024,
	pollerInterval = 2000,
	linkName = 'system-dslink',
	lastAverage;


// var cpuAverage = function () {
 
//   //Initialise sum of idle and time of cores and fetch CPU info
//   var idle = 0,
//   	  total = 0,
//   	  cpus = os.cpus();
 
// 	for(var i = 0, i < cpus.length; i++) {
// 		var cpu = cpus[i];
//     	for(type in cpu.times) {
//     		total += cpu.times[type];
//    		}     
 
//  		idle += cpu.times.idle;
//   }
//   return {idle: idle / cpus.length,  total: total / cpus.length};
// };

// lastAverage = cpuAverage();


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
	

	var cpus = os.cpus(),
		avg = os.loadavg(),
		i, cpu, node;

	// provider.getNode('/cpus/usage').value = new DS.Value()
	provider.getNode('/cpus/load/one').value = new DS.Value(avg[0]);
	provider.getNode('/cpus/load/five').value = new DS.Valueavg[1]);
	provider.getNode('/cpus/load/fifteen').value = new DS.Valueavg[2]);
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


provider.load({
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
			one: {
				'$type': 'number',
				'?value': 0
			},
			five: {
				'$type': 'number',
				'?value': 0
			},
			fifteen: {
				'$type': 'number',
				'?value': 0
			}
		}
	}
});

(new DS.Link(linkName, provider)).connect();

setInterval(function () {
	updateMetrics();
}, pollerInterval);
updateMetrics();