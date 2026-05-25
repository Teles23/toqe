'use strict';

class Expo {
  static isExpoPushToken() {
    return false;
  }
  chunkPushNotifications() {
    return [];
  }
  async sendPushNotificationsAsync() {
    return [];
  }
}

module.exports = { Expo };
