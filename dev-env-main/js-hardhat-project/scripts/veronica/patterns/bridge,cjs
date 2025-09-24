
// Bridge Pattern Implementation, made by Deep

/*

    This implementation demonstrates the Bridge pattern with:

Key Components:

Device (Implementation interface): Defines the operations that all devices must implement

TV & Radio (Concrete Implementations): Actual device implementations

RemoteControl (Abstraction): Defines the high-level interface for remotes

AdvancedRemoteControl (Refined Abstraction): Extends the basic remote functionality

Benefits of this Bridge pattern:

Separation of Concerns: Remotes and devices can evolve independently

Extensibility: Easy to add new devices or new remote types

Flexibility: Any remote can work with any device

Avoids Cartesion Product: Without the bridge, we'd need TVBasicRemote, TVAdvancedRemote, RadioBasicRemote, RadioAdvancedRemote, etc.

The bridge pattern is particularly useful when you have multiple dimensions of variation in your system - in this case, different types of remotes and different types of devices.

Demonstrating bridge separation:");
"Remotes (abstraction) and Devices (implementation) can vary independently:");
- We can add new devices without changing remote classes");
- We can add new remote features without changing device classes");
- Any remote can work with any device (BasicRemote+Radio, AdvancedRemote+TV, etc.)");

This demonstrates the true power of the Bridge pattern - the ability to mix and match different abstractions (remotes) with different implementations (devices) independently!

*/

// Implementation interface
class Device {
  isEnabled() {
    throw new Error("Method 'isEnabled()' must be implemented");
  }
  
  enable() {
    throw new Error("Method 'enable()' must be implemented");
  }
  
  disable() {
    throw new Error("Method 'disable()' must be implemented");
  }
  
  getVolume() {
    throw new Error("Method 'getVolume()' must be implemented");
  }
  
  setVolume(percent) {
    throw new Error("Method 'setVolume()' must be implemented");
  }
  
  getChannel() {
    throw new Error("Method 'getChannel()' must be implemented");
  }
  
  setChannel(channel) {
    throw new Error("Method 'setChannel()' must be implemented");
  }
}

// Concrete Implementations
class TV extends Device {
  constructor() {
    super();
    this.enabled = false;
    this.volume = 50;
    this.channel = 1;
    this.maxChannel = 100;
  }
  
  isEnabled() {
    return this.enabled;
  }
  
  enable() {
    this.enabled = true;
    console.log("TV is now ON");
  }
  
  disable() {
    this.enabled = false;
    console.log("TV is now OFF");
  }
  
  getVolume() {
    return this.volume;
  }
  
  setVolume(percent) {
    if (percent >= 0 && percent <= 100) {
      this.volume = percent;
      console.log(`TV volume set to ${percent}%`);
    }
  }
  
  getChannel() {
    return this.channel;
  }
  
  setChannel(channel) {
    if (channel >= 1 && channel <= this.maxChannel) {
      this.channel = channel;
      console.log(`TV channel set to ${channel}`);
    }
  }
}

class Radio extends Device {
  constructor() {
    super();
    this.on = false;
    this.volume = 30;
    this.station = 88.5;
    this.minStation = 87.5;
    this.maxStation = 108.0;
  }
  
  isEnabled() {
    return this.on;
  }
  
  enable() {
    this.on = true;
    console.log("Radio is now ON");
  }
  
  disable() {
    this.on = false;
    console.log("Radio is now OFF");
  }
  
  getVolume() {
    return this.volume;
  }
  
  setVolume(percent) {
    if (percent >= 0 && percent <= 100) {
      this.volume = percent;
      console.log(`Radio volume set to ${percent}%`);
    }
  }
  
  getChannel() {
    return this.station;
  }
  
  setChannel(station) {
    if (station >= this.minStation && station <= this.maxStation) {
      this.station = station;
      console.log(`Radio station set to ${station} FM`);
    }
  }
}

// Abstraction
class RemoteControl {
  constructor(device) {
    this.device = device;
  }
  
  togglePower() {
    if (this.device.isEnabled()) {
      this.device.disable();
    } else {
      this.device.enable();
    }
  }
  
  volumeDown() {
    this.device.setVolume(this.device.getVolume() - 10);
  }
  
  volumeUp() {
    this.device.setVolume(this.device.getVolume() + 10);
  }
  
  channelDown() {
    this.device.setChannel(this.device.getChannel() - 1);
  }
  
  channelUp() {
    this.device.setChannel(this.device.getChannel() + 1);
  }
}

// Refined Abstraction
class AdvancedRemoteControl extends RemoteControl {
  constructor(device) {
    super(device);
  }
  
  mute() {
    this.device.setVolume(0);
    console.log("Device muted");
  }
  
  setChannel(channel) {
    this.device.setChannel(channel);
  }
  
  getStatus() {
    return {
      enabled: this.device.isEnabled(),
      volume: this.device.getVolume(),
      channel: this.device.getChannel()
    };
  }
}

// Example Usage
console.log("=== Bridge Pattern Example ===\n");

// Create devices
const tv = new TV();
const radio = new Radio();

console.log("1. Basic TV Remote Control:");
const basicTVRemote = new RemoteControl(tv);
basicTVRemote.togglePower(); // Turn TV on
basicTVRemote.volumeUp();
basicTVRemote.volumeUp();
basicTVRemote.channelUp();
basicTVRemote.channelUp();
basicTVRemote.channelUp();
console.log(`TV Status: Channel ${tv.getChannel()}, Volume ${tv.getVolume()}%\n`);

console.log("2. Advanced Radio Remote Control:");
const advancedRadioRemote = new AdvancedRemoteControl(radio);
advancedRadioRemote.togglePower(); // Turn radio on
advancedRadioRemote.setChannel(92.3);
advancedRadioRemote.volumeUp();
advancedRadioRemote.volumeUp();
advancedRadioRemote.mute();
console.log(`Radio Status: Station ${radio.getChannel()} FM, Volume ${radio.getVolume()}%\n`);

console.log("3. Basic Remote with Radio:");
const basicRadioRemote = new RemoteControl(radio);
basicRadioRemote.togglePower();
basicRadioRemote.volumeUp();
basicRadioRemote.channelUp(); // This will increment the station by 1
console.log(`Radio with Basic Remote: Station ${radio.getChannel()} FM, Volume ${radio.getVolume()}%\n`);

console.log("4. Advanced Remote with TV:");
const advancedTVRemote = new AdvancedRemoteControl(tv);
advancedTVRemote.togglePower();
advancedTVRemote.setChannel(42); // Using the advanced feature to set specific channel
advancedTVRemote.volumeUp();
advancedTVRemote.mute(); // Using the advanced mute feature
console.log(`TV with Advanced Remote: Channel ${tv.getChannel()}, Volume ${tv.getVolume()}%\n`);

console.log("5. Switching between devices with same remote:");
// The same remote abstraction can work with different implementations
const universalRemote = new AdvancedRemoteControl(tv);
console.log("Universal remote controlling TV:");
console.log(universalRemote.getStatus());

// Switch to radio
universalRemote.device = radio;
console.log("\nUniversal remote now controlling Radio:");
console.log(universalRemote.getStatus());

console.log("\n6. Demonstrating bridge separation:");
console.log("Remotes (abstraction) and Devices (implementation) can vary independently:");
console.log("- We can add new devices without changing remote classes");
console.log("- We can add new remote features without changing device classes");
console.log("- Any remote can work with any device (BasicRemote+Radio, AdvancedRemote+TV, etc.)");
