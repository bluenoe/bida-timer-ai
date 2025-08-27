# 🎱 Billiards Timer

A modern, minimal, and user-friendly web application for tracking billiards (pool) playtime and calculating the cost in real-time.

## ✨ Features

- **💰 Set Hourly Rate**: Input custom price per hour (default: 29,000 VND/hour)
- **⏱️ Start/Stop Timer**: Easy-to-use timer controls with visual feedback
- **📊 Real-time Calculation**: Live display of elapsed time and corresponding cost
- **🎨 Beautiful UI/UX**: Clean, modern design with smooth animations
- **📱 Mobile-Friendly**: Responsive design that works on all devices
- **⌨️ Keyboard Shortcuts**: Quick access with spacebar, R, and Escape keys
- **🔄 Reset Functionality**: Clear timer and start fresh anytime

## 🚀 How to Use

1. **Open the App**: Open `index.html` in your web browser
2. **Set Your Rate**: Enter the hourly rate in VND (e.g., 29000)
3. **Start Playing**: Click the "Start" button when you begin playing
4. **Monitor Cost**: Watch the timer and cost update in real-time
5. **Stop & Pay**: Click "Stop" when finished to see your total cost
6. **Reset**: Use "Reset" to clear everything and start over

## ⌨️ Keyboard Shortcuts

- **Spacebar**: Start/Stop timer
- **R**: Reset timer
- **Escape**: Stop timer

## 🎯 Example Usage

If the rate is 29,000 VND/hour:
- After 30 minutes: 14,500 VND
- After 1 hour: 29,000 VND
- After 1.5 hours: 43,500 VND

## 🛠️ Technical Details

### Files Structure
```
bida-timer-ai/
├── index.html      # Main HTML structure
├── style.css       # Modern styling and animations
├── script.js       # Timer logic and calculations
└── README.md       # This file
```

### Key Features Implementation

- **Accurate Time Tracking**: Uses `Date.now()` for precise millisecond tracking
- **Real-time Updates**: Updates every 100ms for smooth animations
- **Cost Calculation**: Converts time to cost using precise hour-based calculations
- **Responsive Design**: CSS Grid and Flexbox for mobile-first design
- **Smooth Animations**: CSS transitions and keyframe animations
- **Browser Tab Management**: Handles visibility changes to maintain accuracy

### Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🎨 Design Features

- **Color Palette**: Gradient backgrounds with white container
- **Typography**: Inter font family for modern readability
- **Animations**: Pulse effect on running timer, flash on cost updates
- **Responsive Breakpoints**: 480px and 360px for mobile optimization
- **Visual Feedback**: Button hover effects and state changes

## 💡 Usage Tips

1. **Accurate Timing**: The app continues tracking even when the browser tab is in the background
2. **Safety Warning**: The browser will warn you if you try to close the tab during an active session
3. **Mobile Use**: The app works great on mobile devices - add to your home screen for easy access
4. **Rate Changes**: You can change the hourly rate anytime, and it will immediately update the cost calculation

## 🔧 Customization

To customize the default hourly rate, edit line 29 in `index.html`:
```html
<input type="number" id="hourlyRate" class="rate-input" placeholder="29000" value="29000" min="1">
```

To change colors or styling, modify the CSS variables in `style.css`.

## 📝 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for billiards enthusiasts**