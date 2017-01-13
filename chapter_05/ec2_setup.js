const async = require('async');
const AWS = require('aws-sdk');

const AMI_ID = 'ami-e13739f6';
const KEY_NAME = 'colin-macbook';
const INSTANCE_TYPE = 't2.micro';
const REGION = 'us-east-1';

// Because the JS SDK won't read from ~/.aws/config
AWS.config.update({ region: REGION });

const ec2 = new AWS.EC2();

async.waterfall([
  (callback) => {
    // Start one EC2 instance
    ec2.runInstances({
      ImageId: AMI_ID,
      MinCount: 1,
      MaxCount: 1,
      InstanceType: INSTANCE_TYPE,
      KeyName: KEY_NAME
    }, (err, resp) => {
      if (err) callback(err);
      else {
        const instance = resp.Instances[0];
        console.log(`Launched instance ${instance.InstanceId} in availability zone ${instance.Placement.AvailabilityZone}.`);
        callback(null, instance);
      }
    });
  },
  (instance, callback) => {
    // Wait until that instance is running
    async.doWhilst(
      (cb) => {
        // Perform a check every 5s
        setTimeout(
          () => ec2.describeInstances({
            InstanceIds: [instance.InstanceId]
          }, (err, resp) => {
            if (err) cb(err);
            else {
              const status = resp.Reservations[0].Instances[0].State.Name;
              console.log(`Checking instance ${instance.InstanceId}. Status: ${status}.`);
              cb(null, status);
            }
          }), 5000);
      },
      status => status !== 'running',
      err => callback(err, instance)
    );
  },
  (instance, callback) => {
    // Allocate a new Elastic IP Address and associate it with this instance
    ec2.allocateAddress({}, (err, { PublicIp }) => {
      if (err) callback(err);
      else {
        console.log(`Assigned IP address ${PublicIp}.`);
        ec2.associateAddress({ PublicIp, InstanceId: instance.InstanceId }, (err) => {
          if (!err) {
            console.log(`Associated IP address ${PublicIp} with instance ${instance.InstanceId}.`);
          }
          callback(err, instance);
        });
      }
    });
  },
  (instance, callback) => {
    // Create two EBS volumes
    async.times(2, (n, next) => {
      ec2.createVolume({
        AvailabilityZone: instance.Placement.AvailabilityZone,
        Size: 1,
        VolumeType: 'gp2'
      }, next);
    }, (err, volumes) => {
      if (!err) {
        console.log(`Created EBS volumes ${volumes[0].VolumeId} and ${volumes[1].VolumeId}.`);
      }
      callback(err, instance, volumes);
    });
  },
  (instance, volumes, callback) => {
    // Wait for the volumes to become available
    async.doWhilst(
      (cb) => {
        // Perform a check every 5s
        setTimeout(
          () => ec2.describeVolumes({
            VolumeIds: volumes.map((volume => volume.VolumeId))
          }, cb), 2000);
      },
      (descriptions) => {
        console.log(`Checking volumes. States: ${descriptions.Volumes.map(desc => desc.State)}.`);
        const allAvailable = descriptions.Volumes.every(desc => desc.State === 'available');
        return !allAvailable;
      },
      err => callback(err, instance, volumes)
    );
  },
  (instance, volumes, callback) => {
    // Associate the EBS volumes with the EC2 instance
    const devices = ['/dev/sdf', '/dev/sdg'];
    async.times(2, (n, next) => {
      ec2.attachVolume({
        Device: devices[n],
        InstanceId: instance.InstanceId,
        VolumeId: volumes[n].VolumeId
      }, next);
    }, (err) => {
      if (err) callback(err);
      else {
        console.log(`Attached EBS volumes ${volumes[0].VolumeId} and ${volumes[1].VolumeId} to instance ${instance.InstanceId}.`);
        callback(null);
      }
    });
  }
], (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('🎉');
  }
});
