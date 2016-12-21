'use strict';

// Tag instances with LaunchGroup=startEC2instances to have them auto started

var AWS = require('aws-sdk');
var pify = require('pify');
var Promise = require('pinkie-promise');
var ec2 = new AWS.EC2();
exports.handler = function (event, context) {
	var describeParams = {
		Filters: [
			{
				Name: 'tag:LaunchGroup',
				Values: [
					context.functionName
				]
			}
		]
	};
	pify(ec2.describeInstances.bind(ec2), Promise)(describeParams)
		.then(function (data) {
			var startParams = {
				InstanceIds: []
			};
			data.Reservations.forEach(function (reservation) {
				reservation.Instances.forEach(function (instance) {
					if (instance.State.Code === 80) {
						startParams.InstanceIds.push(instance.InstanceId);
					}
				});
			});
			if (startParams.InstanceIds.length > 0) {
				return pify(ec2.startInstances.bind(ec2), Promise)(startParams);
			}
		})
		.then(context.succeed)
		.catch(context.fail);
};
