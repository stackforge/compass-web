var compassAppDev = angular.module('compassAppDev', ['compass', 'ngMockE2E']);

compassAppDev.run(function($httpBackend, settings, $http) {

    // Allow all calls not to the API to pass through normally
    $httpBackend.whenGET(new RegExp('src\/.*')).passThrough();
    $httpBackend.whenGET(new RegExp('data\/.*')).passThrough();

    $httpBackend.whenGET(settings.apiUrlBase + '/adapters').respond(function(method, url, data) {
        console.log(method, url);
        var adapters = [{
            "id": 1,
            "name": "openstack",
            "display": "OpenStack",
            "os_installer": "cobbler",
            "package_installer": "chef",
            "roles": [{
                "display_name": "Compute",
                "name": "os-compute-worker"
            }, {
                "display_name": "Controller",
                "name": "os-controller"
            }, {
                "display_name": "Network",
                "name": "os-network"
            }, {
                "display_name": "Storage",
                "name": "os-block-storage-worker"
            }],
            "compatible_os": [{
                "name": "CentOs",
                "os_id": 1
            }, {
                "name": "Ubuntu",
                "os_id": 2
            }]
        }, {
            "id": 2,
            "name": "hadoop",
            "display": "Hadoop",
            "os_installer": "cobbler",
            "package_installer": "chef",
            "roles": [{
                "display_name": "Compute",
                "name": "os-compute-worker"
            }, {
                "display_name": "Controller",
                "name": "os-controller"
            }, {
                "display_name": "Network",
                "name": "os-network"
            }],
            "compatible_os": [{
                "name": "CentOs",
                "os_id": 1
            }]
        }];
        return [200, adapters, {}];
    });

    $httpBackend.whenGET(/\.*\/adapters\/[1-9][0-9]*/).respond(function(method, url, data) {
        console.log(method, url);
        var adapter = {
            "id": 1,
            "name": "openstack",
            "display": "OpenStack",
            "os_installer": "cobbler",
            "package_installer": "chef",
            "roles": [{
                "display_name": "Compute",
                "name": "os-compute-worker"
            }, {
                "display_name": "Controller",
                "name": "os-controller"
            }, {
                "display_name": "Network",
                "name": "os-network"
            }, {
                "display_name": "Storage",
                "name": "os-block-storage-worker"
            }],
            "compatible_os": [{
                "name": "CentOs",
                "os_id": 1
            }, {
                "name": "Ubuntu",
                "os_id": 2
            }]
        };
        return [200, adapter, {}];
    });

    $httpBackend.whenGET(settings.apiUrlBase + '/machines-hosts').respond(function(method, url, data) {
        console.log(method, url);
        var servers = [{
            "machine_id": 10,
            "mac": "28.e5.ee.47.14.92",
            "switch_ip": "172.29.8.40",
            "vlan": "1",
            "port": "1",
            "name": "sv-1",
            "clusters": ["cluster1", "cluster2"],
            "os": "CentOS",
            "adapter": "OpenStack",
            "roles": [{
                "display_name": "Compute",
                "name": "os-compute-worker"
            }, {
                "display_name": "Controller",
                "name": "os-controller"
            }, {
                "display_name": "Network",
                "name": "os-network"
            }, {
                "display_name": "Storage",
                "name": "os-block-storage-worker"
            }],
            "network": {},
            "state": "Installing"
        }, {
            "machine_id": 11,
            "mac": "28.e5.ee.47.a2.93",
            "switch_ip": "172.29.8.40",
            "vlan": "2",
            "port": "2",
            "name": "sv-2",
            "clusters": ["cluster1"],
            "os": "CentOS",
            "adapter": "OpenStack",
            "roles": [{
                "display_name": "Network",
                "name": "os-network"
            }, {
                "display_name": "Storage",
                "name": "os-block-storage-worker"
            }],
            "network": {},
            "state": "Successful"
        }];
        console.log(servers);
        return [200, servers, {}];
    });

    $httpBackend.whenPOST(settings.apiUrlBase + '/clusters').respond(function(method, url, data) {
        console.log(method, url, data);
        var postData = JSON.parse(data)
        var mockResponse = {
            "id": 1,
            "name": postData.name,
            "adapter_id": 1,
            "os_id": 1,
            "editable": true,
            "create_by": "user@someemail.com",
            "create_at": "2014-3-25 12:00:00",
            "updated_at": "2014-3-26 13:00:00",
            "link": {
                "href": "/clusters/1",
                "ref": "self"
            }
        };
        return [201, mockResponse, {}];
    });

    $httpBackend.whenGET(settings.apiUrlBase + '/clusters').respond(function(method, url, data) {
        console.log(method, url);
        var clusters = [{
            "id": 1,
            "name": "cluster_01",
            "adapter_id": 1,
            "os_id": 1,
            "editable": true,
            "create_by": "user@someemail.com",
            "create_at": "2014-3-25 12:00:00",
            "updated_at": "2014-3-26 13:00:00",
            " links": [{
                "href": "/clusters/1",
                "rel": "self"
            }, {
                "href": "/clusters/1/hosts",
                "rel": "hosts"
            }]
        }, {
            "id": 2,
            "name": "cluster_02",
            "adapter_id": 1,
            "os_id": 1,
            "editable": true,
            "create_by": "user@someemail.com",
            "create_at": "2014-4-25 12:00:00",
            "updated_at": "2014-4-26 13:00:00",
            " links": [{
                "href": "/clusters/2",
                "rel": "self"
            }, {
                "href": "/clusters/2/hosts",
                "rel": "hosts"
            }]
        }];
        return [200, clusters, {}];
    });

    $httpBackend.whenPUT(/\.*\/clusters\/[1-9][0-9]*\/config/).respond(function(method, url, data) {
        console.log(method, url, data);
        var config = JSON.parse(data);

        console.log(config);
        return [200, config, {}];
    });

    $httpBackend.whenGET(settings.apiUrlBase + '/subnetworks').respond(function(method, url, data) {
        console.log(method, url);
        var subnetworks = [{
            "subnet_id": 1,
            "name": "net1",
            "subnet": "192.168.1.0",
            "netmask": "255.255.255.0",
        }, {
            "subnet_id": 2,
            "name": "net2",
            "subnet": "172.165.1.0",
            "netmask": "255.255.255.0",
        }];
        return [200, subnetworks, {}];
    });

    $httpBackend.whenPOST(settings.apiUrlBase + '/subnetworks').respond(function(method, url, data) {
        console.log(method, url, data);

        var subnetConfig = JSON.parse(data);
        subnetConfig.subnet_id = Math.floor((Math.random() * 100) + 1);

        console.log(subnetConfig);
        return [200, subnetConfig, {}];
    });

    $httpBackend.whenPUT(/\.*\/subnetworks\/[1-9][0-9]*/).respond(function(method, url, data) {
        console.log(method, url, data);

        var subnetConfig = JSON.parse(data);

        console.log(subnetConfig);
        return [200, subnetConfig, {}];
    });

    // keep routing table for later use
    /*
    $httpBackend.whenPOST(/\.*\/clusters\/[1-9][0-9]*\/routing-table/).respond(function(method, url, data) {
        console.log(method, url, data);

        var routingTable = JSON.parse(data);
        routingTable.id = Math.floor((Math.random() * 100) + 1);

        console.log(routingTable);
        return [200, routingTable, {}];
    });

    $httpBackend.whenPUT(/\.*\/clusters\/[1-9][0-9]*\/routing-table\/[1-9][0-9]/).respond(function(method, url, data) {
        console.log(method, url, data);

        var routingTable = JSON.parse(data);

        console.log(routingTable);
        return [200, routingTable, {}];
    });
    */

    $httpBackend.whenPOST(/\.*\/clusters\/[1-9][0-9]*\/action/).respond(function(method, url, data) {
        console.log(method, url, data);
        var actionResponse = {
            "hosts": [{
                "id": Math.floor((Math.random() * 100) + 1),
                "machine_id": 10
            }, {
                "id": Math.floor((Math.random() * 100) + 1),
                "machine_id": 11
            }]
        }
        return [200, actionResponse, {}];
    });

    $httpBackend.whenPUT(/\.*\/hosts\/[1-9][0-9]*/).respond(function(method, url, data) {
        console.log(method, url, data);
        var host_config = JSON.parse(data);
        return [200, host_config, {}];
    });

    $httpBackend.whenPOST(/\.*\/hosts\/[1-9][0-9]*\/network/).respond(function(method, url, data) {
        console.log(method, url, data);
        var network = JSON.parse(data);
        network.id = Math.floor((Math.random() * 100) + 1);
        return [200, network, {}];
    });

    $httpBackend.whenPUT(/\.*\/hosts\/[1-9][0-9]*\/network\/[1-9][0-9]/).respond(function(method, url, data) {
        console.log(method, url, data);
        var network = JSON.parse(data);
        return [200, network, {}];
    });

    $httpBackend.whenPUT(/\.*\/clusters\/[1-9][0-9]*\/hosts\/[1-9][0-9]*\/config/).respond(function(method, url, data) {
        console.log(method, url, data);
        var config = JSON.parse(data);
        return [200, config, {}];
    });
});
