angular.module('compass.wizard', [
    'ui.router',
    'ui.bootstrap',
    'ngTable',
    'compass.charts',
    'ngDragDrop'
])

.config(function config($stateProvider) {
    $stateProvider
        .state('wizard', {
            url: '/wizard?config',
            controller: 'wizardCtrl',
            templateUrl: 'src/app/wizard/wizard.tpl.html'
        });
})

.controller('wizardCtrl', function($scope, dataService, wizardFactory, $stateParams) {
    if ($stateParams.config == "true") {
        dataService.getWizardPreConfig().success(function(data) {
            wizardFactory.preConfig(data);
        });
    }

    // current step for create-cluster wizard
    $scope.currentStep = 1;

    // get the wizard steps for create-cluster
    dataService.getWizardSteps().success(function(data) {
        // get the wizard steps for os, ts or os_and_ts
        $scope.steps = data["os_and_ts"];
        wizardFactory.setSteps($scope.steps);

        // change ui steps css if currentStep changes
        $scope.$watch('currentStep', function(newStep, oldStep) {
            if (newStep > 0 && newStep <= $scope.steps.length) {
                if (newStep > oldStep) {
                    $scope.steps[newStep - 1].state = "active";
                    for (var i = 0; i < newStep - 1; i++)
                        $scope.steps[i].state = "complete";
                } else if (newStep < oldStep) {
                    $scope.steps[newStep - 1].state = "active";
                    for (var j = newStep; j < $scope.steps.length; j++)
                        $scope.steps[j].state = "";
                }
            }
        });

        // go to next step
        $scope.stepForward = function() {
            // trigger commit for current step
            var commitState = {
                "name": $scope.steps[$scope.currentStep - 1].name,
                "state": "triggered",
                "message": ""
            };
            wizardFactory.setCommitState(commitState);

            // watch commit state change
            $scope.$watch(function() {
                return wizardFactory.getCommitState()
            }, function(newCommitState, oldCommitState) {
                switch (newCommitState.name) {
                    case "sv_selection":
                    case "os_global":
                    case "network":
                    case "partition":
                    case "security":
                    case "role_assign":
                    case "network_mapping":
                        if (newCommitState.name == $scope.steps[$scope.currentStep - 1].name && newCommitState.state == "success") {
                            console.warn("### catch success in wizardCtrl ###", newCommitState, oldCommitState);
                            $scope.next();
                        } else if (newCommitState.state == "error") {
                            // TODO: error handling / display error message
                            console.warn("### catch error in wizardCtrl ###", newCommitState, oldCommitState);
                        }
                        break;
                    case "review":
                        // TODO: go to cluster overview page
                        break;
                    default:
                        break;
                }
            })
        };

        $scope.next = function() {
            if ($scope.currentStep < $scope.steps.length)
                $scope.currentStep = $scope.currentStep + 1;
        }

        // go to previous step
        $scope.stepBackward = function() {
            if ($scope.currentStep > 1) {
                $scope.currentStep = $scope.currentStep - 1;
            }
        };

        // go to step by stepId
        $scope.goToStep = function(stepId) {
            $scope.currentStep = stepId;
        };
    });

    dataService.getAllMachineHosts().success(function(data) {
        wizardFactory.setAllMachinesHost(data);
    });

    dataService.getSubnetConfig().success(function(data) {
        wizardFactory.setSubnetworks(data);
    });

})

.controller('svSelectCtrl', function($scope, wizardFactory, dataService, $filter, ngTableParams) {
    $scope.hideunselected = '';
    $scope.search = {};

    $scope.allservers = wizardFactory.getAllMachinesHost();

    $scope.selectAllServers = function(flag) {
        if (flag) {
            angular.forEach($scope.allservers, function(sv) {
                sv.selected = true;
            })
        } else {
            angular.forEach($scope.allservers, function(sv) {
                sv.selected = false;
            })
        }
    };

    dataService.getServerColumns().success(function(data) {
        $scope.server_columns = data.showall;
    });

    $scope.hideUnselected = function() {
        if ($scope.hideunselected) {
            $scope.search.selected = true;
        } else {
            delete $scope.search.selected;
        }
    };

    $scope.tableParams = new ngTableParams({
        page: 1, // show first page
        count: $scope.allservers.length // count per page       
    }, {
        counts: [], // hide count-per-page box
        total: $scope.allservers.length, // length of data
        getData: function($defer, params) {
            // use build-in angular filter
            var orderedData = params.sorting() ?
                $filter('orderBy')($scope.allservers, params.orderBy()) : $scope.allservers;

            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.$watch(function() {
        return wizardFactory.getCommitState()
    }, function(newCommitState, oldCommitState) {
        if (newCommitState !== undefined) {
            if (newCommitState.name == "sv_selection" && newCommitState.state == "triggered") {
                $scope.commit();
            }
        }
    });

    $scope.commit = function() {
        var selectedServers = [];
        var noSelection = true;
        angular.forEach($scope.allservers, function(sv) {
            if (sv.selected) {
                noSelection = false;
                selectedServers.push(sv);
            }
        })
        if (noSelection) {
            alert("Please select at least one server");
            wizardFactory.setCommitState({});
        } else {
            wizardFactory.setServers(selectedServers);
            wizardFactory.setAllMachinesHost($scope.allservers);

            var commitState = {
                "name": "sv_selection",
                "state": "success",
                "message": ""
            };
            wizardFactory.setCommitState(commitState);
        }
    };
})

.controller('globalCtrl', function($scope, wizardFactory, dataService, $q) {
    var cluster = wizardFactory.getClusterInfo();

    //For General Section
    $scope.general = wizardFactory.getGeneralConfig();

    if (!$scope.general["dns_servers"]) {
        $scope.general["dns_servers"] = [""];
    }
    if (!$scope.general["search_path"]) {
        $scope.general["search_path"] = [""];
    }
    if (!$scope.general["http_proxy"]) {
        $scope.general["http_proxy"] = [""];
    }
    if (!$scope.general["https_proxy"]) {
        $scope.general["https_proxy"] = [""];
    }
    if (!$scope.general["default_no_proxy"]) {
        $scope.general["default_no_proxy"] = [""];
    }

    $scope.addValue = function(key) {
        $scope.general[key].push("");
        console.log($scope.general);
        console.log($scope.general.http_proxy.length)
    };

    dataService.getTimezones().success(function(data) {
        $scope.timezones = data;
    });

    //For Subnetworks Section
    $scope.subnetworks = wizardFactory.getSubnetworks();
    $scope.addSubnetwork = function() {
        $scope.subnetworks.push({});
        console.log($scope.subnetworks);
    };
    $scope.removeSubnetwork = function(index) {
        $scope.subnetworks.splice(index, 1)
    };
    $scope.$watch('subnetworks', function() {
        if ($scope.subnetworks.length == 0) {
            $scope.subnetworks.push({});
        }
    }, true);

    //For Routing Table Section
    //keep routing table for later use
    /*
    $scope.routingtable = wizardFactory.getRoutingTable();
    $scope.addRoute = function() {
        $scope.routingtable.push({});
        console.log($scope.routingtable);
    };
    $scope.removeRoute = function(index) {
        $scope.routingtable.splice(index, 1)
    };
    $scope.$watch('routingtable', function() {
        if ($scope.routingtable.length == 0) {
            $scope.routingtable.push({});
        }
    }, true);
    */

    $scope.$watch(function() {
        return wizardFactory.getCommitState()
    }, function(newCommitState, oldCommitState) {

        if (newCommitState !== undefined) {
            if (newCommitState.name == "os_global" && newCommitState.state == "triggered") {
                $scope.commit();
            }
        }
    });

    $scope.commit = function() {
        var promises = [];
        var os_global_general = {
            "os_config": {
                "general": $scope.general
            }
        };
        var updateClusterConfig = dataService.updateClusterConfig(cluster.id, os_global_general).then(function(configData) {
            wizardFactory.setGeneralConfig(configData.data["os_config"]["general"]);
        }, function(response) {
            return $q.reject(response);
        });
        promises.push(updateClusterConfig);

        var subnetworks = [];
        angular.forEach($scope.subnetworks, function(subnet) {
            if (subnet.subnet_id === undefined) {
                // post subnetworks
                var updateSubnetConfig = dataService.postSubnetConfig(subnet).then(function(subnetData) {
                    subnetworks.push(subnetData.data);
                }, function(response) {
                    return $q.reject(response);
                });
                promises.push(updateSubnetConfig);
            } else {
                // put subnetworks
                var updateSubnetConfig = dataService.putSubnetConfig(subnet.subnet_id, subnet).then(function(subnetData) {
                    subnetworks.push(subnetData.data);
                }, function(response) {
                    return $q.reject(response);
                });
                promises.push(updateSubnetConfig);
            }
        });

        $q.all(promises).then(function() {
            $scope.subnetworks = subnetworks;
            wizardFactory.setSubnetworks($scope.subnetworks);
            var commitState = {
                "name": "os_global",
                "state": "success",
                "message": ""
            };
            wizardFactory.setCommitState(commitState);
        }, function(response) {
            console.log("promises error", response);
            var commitState = {
                "name": "os_global",
                "state": "error",
                "message": response.statusText
            };
            wizardFactory.setCommitState(commitState);
        });
    };

    // keey routing table for later use
    /*
    $scope.updateRoutingTable = function() {
        var routingCount = $scope.routingtable.length;
        var routingTable = [];
        var i = 0;
        angular.forEach($scope.routingtable, function(rt) {
            if (rt.id === undefined) {
                // post routing table
                dataService.postRoutingTable(cluster.id, rt).success(function(routingData) {
                    routingTable.push(routingData);
                    i++;
                    if (i == routingCount) {
                        $scope.routingtable = routingTable;
                        wizardFactory.setRoutingTable(routingTable);
                    }
                })
            } else {
                // put routing table
                dataService.putRoutingTable(cluster.id, rt.id, rt).success(function(routingData) {
                    routingTable.push(routingData);
                    i++;
                    if (i == routingCount) {
                        $scope.routingtable = routingTable;
                        wizardFactory.setRoutingTable(routingTable);
                    }
                })
            }
        })
    };
    */
})

.controller('networkCtrl', function($scope, wizardFactory, dataService, $filter, ngTableParams, $q) {
    var cluster = wizardFactory.getClusterInfo();
    $scope.subnetworks = wizardFactory.getSubnetworks();
    $scope.interfaces = wizardFactory.getInterfaces();
    $scope.servers = wizardFactory.getServers();

    dataService.getServerColumns().success(function(data) {
        $scope.server_columns = data.showless;
    });

    $scope.tableParams = new ngTableParams({
        page: 1, // show first page
        count: $scope.servers.length + 1 // count per page
    }, {
        counts: [], // hide count-per-page box
        total: $scope.servers.length, // length of data
        getData: function($defer, params) {
            // use build-in angular filter
            var orderedData = params.sorting() ?
                $filter('orderBy')($scope.servers, params.orderBy()) : $scope.servers;

            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.addInterface = function(newInterface) {
        var isExist = false;
        angular.forEach($scope.interfaces, function(value, key) {
            if (key == newInterface.name) {
                isExist = true;
                alert("This interface already exists. Please try another one");
            }
        })
        if (!isExist) {
            $scope.interfaces[newInterface.name] = {
                "subnet_id": newInterface.subnet_id,
                "is_mgmt": false,
            }
        }
        $scope.newInterface = {};
    };

    $scope.deleteInterface = function(delInterface) {
        delete $scope.interfaces[delInterface];
        angular.forEach($scope.servers, function(sv) {
            delete sv.network[delInterface];
        })
    };

    $scope.$watch('addInterfacePanel', function(value) {
        if (!$scope.addInterfacePanel.isCollapsed) {
            $scope.autoFillPanel.isCollapsed = true;
        }
    }, true);

    $scope.$watch('autoFillPanel', function(value) {
        if (!$scope.autoFillPanel.isCollapsed) {
            $scope.addInterfacePanel.isCollapsed = true;
        }
    }, true);

    $scope.$watch(function() {
        return wizardFactory.getCommitState()
    }, function(newCommitState, oldCommitState) {
        if (newCommitState !== undefined) {
            if (newCommitState.name == "network" && newCommitState.state == "triggered") {
                $scope.commit();
            }
        }
    });

    $scope.commit = function() {
        var addHostsAction = {
            "add_hosts": {
                "machines": []
            }
        };
        angular.forEach($scope.servers, function(server) {
            if (server.reinstallos === undefined) {
                addHostsAction.add_hosts.machines.push({
                    "machine_id": server.machine_id
                });
            } else {
                addHostsAction.add_hosts.machines.push({
                    "machine_id": server.machine_id,
                    "reinstall_os": server.reinstallos
                });
            }
        });

        var interfaceCount = Object.keys($scope.interfaces).length;
        if (interfaceCount == 0) {
            alert("Please add interface");
        } else {
            // add hosts
            dataService.postClusterActions(cluster.id, addHostsAction).success(function(data) {
                var hosts = data.hosts;
                for (var i = 0; i < $scope.servers.length; i++) {
                    for (var j = 0; j < hosts.length; j++) {
                        if ($scope.servers[i].machine_id == hosts[j].machine_id) {
                            $scope.servers[i].host_id = hosts[j].id;
                            break;
                        }
                    }
                }

                var hostnamePromises = [];
                var hostNetworkPromises = [];

                angular.forEach($scope.servers, function(server) {
                    var hostname = {
                        "name": server["name"]
                    };
                    // update hostname
                    var updateHostname = dataService.putHost(server.host_id, hostname).then(function(hostData) {
                        // success callback
                    }, function(response) {
                        // error callback
                        return $q.reject(response);
                    });
                    hostnamePromises.push(updateHostname);

                    angular.forEach(server.network, function(value, key) {
                        var network = {
                            "interface": key,
                            "ip": value.ip,
                            "subnet_id": $scope.interfaces[key].subnet_id,
                            "is_mgmt": $scope.interfaces[key].is_mgmt
                        };
                        if (value.id === undefined) {
                            // post host network
                            var updateNetwork = dataService.postHostNetwork(server.host_id, network).then(function(networkData) {
                                // success callback
                                console.log("post networkdata", networkData.data);
                                var interface = networkData.data.interface;
                                var networkId = networkData.data.id;
                                server.network[interface].id = networkId;
                            }, function(response) {
                                // error callback
                                return $q.reject(response);
                            });
                            hostNetworkPromises.push(updateNetwork);
                        } else {
                            // put host network
                            var updateNetwork = dataService.putHostNetwork(server.host_id, value.id, network).then(function(networkData) {
                                // success callback
                                console.log("put networkdata", networkData.data);
                            }, function(response) {
                                // error callback
                                return $q.reject(response);
                            });
                            hostNetworkPromises.push(updateNetwork);
                        }
                    });
                });

                $q.all(hostnamePromises.concat(hostNetworkPromises)).then(function() {
                    // update hostname and network for all hosts successfully
                    wizardFactory.setServers($scope.servers);
                    var commitState = {
                        "name": "network",
                        "state": "success",
                        "message": ""
                    };
                    wizardFactory.setCommitState(commitState);
                }, function(response) {
                    var commitState = {
                        "name": "network",
                        "state": "error",
                        "message": response.statusText
                    };
                    wizardFactory.setCommitState(commitState);
                });
            });
        }
    };

    $scope.autofill = function() {
        //TODO: add auto fill
        alert("Autofill coming soon");
    };
})

.controller('partitionCtrl', function($scope, wizardFactory, dataService) {
    var cluster = wizardFactory.getClusterInfo();
    $scope.partition = wizardFactory.getPartition();

    $scope.addPartition = function() {
        var mount_point = $scope.newPartition.mount_point;
        $scope.partition[mount_point] = {};
        $scope.partition[mount_point].size_percentage = $scope.newPartition.size_percentage;
        $scope.partition[mount_point].max_size = $scope.newPartition.max_size;
        $scope.newPartition = {};
    };

    $scope.deletePartition = function(mount_point) {
        delete $scope.partition[mount_point];
    };

    $scope.$watch('partition', function() {
        $scope.partitionarray = [];
        angular.forEach($scope.partition, function(value, key) {
            $scope.partitionarray.push({
                "name": key,
                "number": value.size_percentage
            });
        });
    }, true);

    $scope.$watch(function() {
        return wizardFactory.getCommitState()
    }, function(newCommitState, oldCommitState) {
        if (newCommitState !== undefined) {
            if (newCommitState.name == "partition" && newCommitState.state == "triggered") {
                $scope.commit();
            }
        }
    });

    $scope.commit = function() {
        var os_partition = {
            "os_config": {
                "partition": $scope.partition
            }
        };
        dataService.updateClusterConfig(cluster.id, os_partition).success(function(configData) {
            wizardFactory.getPartition(configData["os_config"]["partition"]);
            var commitState = {
                "name": "partition",
                "state": "success",
                "message": ""
            };
            wizardFactory.setCommitState(commitState);
        });
        //TODO: error handling
    };
})

.controller('securityCtrl', function($scope, wizardFactory, dataService) {
    var cluster = wizardFactory.getClusterInfo();
    $scope.server_credentials = wizardFactory.getServerCredentials();
    $scope.service_credentials = wizardFactory.getServiceCredentials();
    $scope.management_credentials = wizardFactory.getManagementCredentials();

    $scope.$watch(function() {
        return wizardFactory.getCommitState()
    }, function(newCommitState, oldCommitState) {
        if (newCommitState !== undefined) {
            if (newCommitState.name == "security" && newCommitState.state == "triggered") {
                $scope.commit();
            }
        }
    });

    $scope.commit = function() {
        var securityData = {
            "os_config": {
                "username": $scope.server_credentials.username,
                "password": $scope.server_credentials.password
            },
            "package_config": {
                "security": {
                    "service_credentials": $scope.service_credentials,
                    "console_crendentials": $scope.management_credentials
                }
            }
        };
        dataService.updateClusterConfig(cluster.id, securityData).success(function(data) {
            var commitState = {
                "name": "security",
                "state": "success",
                "message": ""
            };
            wizardFactory.setCommitState(commitState);
        });
    };
})

.controller('roleAssignCtrl', function($scope, wizardFactory, dataService, $filter, ngTableParams, $q) {
    var cluster = wizardFactory.getClusterInfo();
    $scope.servers = wizardFactory.getServers();

    dataService.getAdapter(cluster.adapter_id).success(function(data) {
        wizardFactory.setAdapter(data);
        $scope.roles = data.roles;
    });

    dataService.getServerColumns().success(function(data) {
        $scope.server_columns = data.showless;
    });

    $scope.selectAllServers = function(flag) {
        if (flag) {
            angular.forEach($scope.servers, function(sv) {
                sv.checked = true;
            })
        } else {
            angular.forEach($scope.servers, function(sv) {
                sv.checked = false;
            })
        }
    };

    $scope.removeRole = function(server, role) {
        var serverIndex = $scope.servers.indexOf(server);
        var roleIndex = $scope.servers[serverIndex].roles.indexOf(role);
        $scope.servers[serverIndex].roles.splice(roleIndex, 1);
    };

    $scope.assignRole = function(role) {
        var serverChecked = false;
        for (var i = 0; i < $scope.servers.length; i++) {
            if ($scope.servers[i].checked) {
                serverChecked = true;
            }
        }
        if (!serverChecked) {
            alert("Please select at least one server");
        } else {
            // get selected servers and assign role to them
            var roleExist = false;
            for (var i = 0; i < $scope.servers.length; i++) {
                if ($scope.servers[i].checked) {
                    for (var j = 0; j < $scope.servers[i].roles.length; j++) {
                        if (role.name == $scope.servers[i].roles[j].name) {
                            roleExist = true;
                        }
                    }
                    if (!roleExist) {
                        $scope.servers[i].roles.push(role);
                    } else {
                        roleExist = false;
                    }
                }
            }
        }
    };

    $scope.tableParams = new ngTableParams({
        page: 1, // show first page
        count: $scope.servers.length + 1 // count per page
    }, {
        counts: [], // hide count-per-page box
        total: $scope.servers.length, // length of data
        getData: function($defer, params) {
            // use build-in angular filter
            var orderedData = params.sorting() ?
                $filter('orderBy')($scope.servers, params.orderBy()) : $scope.servers;

            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.$watch(function() {
        return wizardFactory.getCommitState()
    }, function(newCommitState, oldCommitState) {
        if (newCommitState !== undefined) {
            if (newCommitState.name == "role_assign" && newCommitState.state == "triggered") {
                $scope.commit();
            }
        }
    });

    $scope.commit = function() {
        var promises = [];
        angular.forEach($scope.servers, function(server) {
            var roles = [];
            angular.forEach(server.roles, function(role) {
                roles.push(role.name);
            });
            var config = {
                "package_config": {
                    "roles": roles
                }
            };
            var updateRoles = dataService.updateClusterHostConfig(cluster.id, server.host_id, config).then(function(configData) {
                // success callback
            }, function(response) {
                // error callback
                return $q.reject(response);
            });
        });

        $q.all(promises).then(function() {
            wizardFactory.setServers($scope.servers);
            var commitState = {
                "name": "role_assign",
                "state": "success",
                "message": ""
            };
            wizardFactory.setCommitState(commitState);
        }, function(response) {
            console.log("promises error", response);
            var commitState = {
                "name": "role_assign",
                "state": "error",
                "message": response.statusText
            };
            wizardFactory.setCommitState(commitState);
        });
    };
})

.controller('networkMappingCtrl', function($scope, wizardFactory, dataService) {
    var cluster = wizardFactory.getClusterInfo();
    $scope.interfaces = wizardFactory.getInterfaces();
    $scope.networking = wizardFactory.getNetworkMapping();

    $scope.pendingInterface = "";

    $scope.onDrop = function($event, key) {
        $scope.pendingInterface = key;
    };

    $scope.dropSuccessHandler = function($event, key, dict) {
        dict[key].mapping_interface = $scope.pendingInterface;
    };

    $scope.$watch(function() {
        return wizardFactory.getCommitState()
    }, function(newCommitState, oldCommitState) {
        if (newCommitState !== undefined) {
            if (newCommitState.name == "network_mapping" && newCommitState.state == "triggered") {
                $scope.commit();
            }
        }
    });

    $scope.commit = function() {
        var networks = {};
        angular.forEach($scope.networking, function(value, key) {
            networks[key] = value.mapping_interface;
        });
        var network_mapping = {
            "package_config": {
                "network_mapping": networks
            }
        };
        dataService.updateClusterConfig(cluster.id, network_mapping).success(function(data) {
            wizardFactory.setNetworkMapping($scope.networking);
            var commitState = {
                "name": "network_mapping",
                "state": "success",
                "message": ""
            };
            wizardFactory.setCommitState(commitState);
        });
        //TODO: error handling
    };
})

