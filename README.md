# Daylight-for-Hue
Controls lighting of Philips Hue light bulbs to match outdoor lighting based on local weather conditions.

### Work In Progress -Currently under heavy development, so will change rapidly and UI is a prototype.

Written in HTML5/CSS3/Javascript, using jQuery for API/JSON access and Bootstrap for UI functionality, but will be porting to AngularJS soon. Ultimately will be used as the basis for a web/mobile app that can be used to display weather conditions as well as naturally control the lighting of a room equipped with Philips Hue light bulbs.

##Features: 
  * Pulls local weather information down from Weather Underground and Forecast.io APIs.
  * Displays weather information in a cleanly designed UI (Current UI is just a scaffold). Ideal for mobile/tablet, especially when wall-mounted. 
  * Connects to a Philips Hue bridge to automate control of lights within the house. In-app configuration not built yet, currently hardcoded to my bridge.

   Several lighting features:
    1. Matches lighting to time of day - daylight is a golden color (2000K) during sunrise/sunset, gradually rising to 5500K at high noon. When accurately matched, the indoor lighting reinforces the outdoor lighting to make the residence feel outdoors and expansive.
    2. Can intuitively display outdoor temperature by the color of one of the bulbs, so at a glance you can tell whether there are uncomfortable conditions outdoors. Above 80F the light will turn progressively more red, under 40F the light will turn progressively more blue. 
    3. Likewise, can alert to rain/snow by the color of another bulb, which will turn progressively more violet as the intensity of precipitation increases.
    4. Will simulate the passing of clouds, by linking to a local weather station that directly measures solar radiation. When clouds pass over the sun, the lights will dim slightly and the color temperature will raise to 6500K. The effect very strongly mimics the natural passing of clouds, and further enhances the indoor ambiance to feel more open and expansive.
