# Deployment Guide

## 🚀 **Quick Deployment**

### **Vercel (Recommended)**

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Complete document intelligence dashboard"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Environment Variables in Vercel**
   ```env
   NEXT_PUBLIC_USE_REAL_API=true
   NEXT_PUBLIC_NAVACORD_API_URL=https://api.navacord.9ai.in
   NEXT_PUBLIC_NAVACORD_API_TOKEN=your_actual_token_here
   ```

### **Netlify**

1. **Build Settings**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

2. **Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add the same variables as above

### **Docker Deployment**

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t document-intelligence .
   docker run -p 3000:3000 document-intelligence
   ```

## 🔧 **Production Configuration**

### **Environment Variables**
```env
# Production API Settings
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_NAVACORD_API_URL=https://api.navacord.9ai.in
NEXT_PUBLIC_NAVACORD_API_TOKEN=your_production_token

# Optional: Custom API Endpoints
NEXT_PUBLIC_CUSTOM_API_URL=https://your-api.com
```

### **Performance Optimization**
- ✅ **Built-in Optimization**: Next.js automatic optimizations
- ✅ **Image Optimization**: Automatic image optimization
- ✅ **Code Splitting**: Automatic route-based splitting
- ✅ **Static Generation**: Pre-rendered pages where possible

### **Monitoring Setup**
- ✅ **Error Tracking**: Built-in error boundaries
- ✅ **Performance Monitoring**: Web Vitals tracking
- ✅ **API Monitoring**: Request/response logging
- ✅ **User Analytics**: Page view tracking

## 📊 **Post-Deployment**

### **Testing Production**
1. **Verify API Connection**
   - Check API status indicator shows "NavaCord API"
   - Test document upload
   - Verify extraction results

2. **Performance Testing**
   - Test with multiple PDF files
   - Check processing speed
   - Verify PDF generation

3. **Error Handling**
   - Test with invalid files
   - Check network error handling
   - Verify graceful degradation

### **Monitoring**
- **API Response Times**: Monitor extraction speed
- **Error Rates**: Track failed extractions
- **User Engagement**: Monitor feature usage
- **PDF Generation**: Track download success rates

## 🔒 **Security Considerations**

### **API Security**
- ✅ **Token Management**: Secure token storage
- ✅ **HTTPS Only**: Enforce encrypted connections
- ✅ **Input Validation**: Validate all uploads
- ✅ **Rate Limiting**: Implement API rate limits

### **Data Privacy**
- ✅ **Client-side Processing**: PDF merging on client
- ✅ **No Data Storage**: No persistent document storage
- ✅ **Secure Transmission**: Encrypted API communication
- ✅ **Local Schema Storage**: Schemas stored locally only

## 🚀 **Go Live Checklist**

### **Pre-Launch**
- [ ] Set `NEXT_PUBLIC_USE_REAL_API=true`
- [ ] Configure production API token
- [ ] Test all features with real API
- [ ] Verify PDF generation works
- [ ] Check error handling

### **Launch**
- [ ] Deploy to production
- [ ] Verify environment variables
- [ ] Test live functionality
- [ ] Monitor error logs
- [ ] Check performance metrics

### **Post-Launch**
- [ ] Monitor API usage
- [ ] Track user feedback
- [ ] Monitor error rates
- [ ] Plan feature updates
- [ ] Regular security updates

## 📈 **Scaling Considerations**

### **High Volume Usage**
- **API Rate Limits**: Monitor NavaCord API limits
- **Client Performance**: Optimize for large files
- **Browser Memory**: Handle large PDF merging
- **Network Optimization**: Implement request caching

### **Feature Expansion**
- **Additional File Types**: Support more document formats
- **Batch Processing**: Queue multiple jobs
- **User Management**: Add authentication
- **Analytics Dashboard**: Usage statistics

The dashboard is now ready for production deployment with full NavaCord API integration! 🎉
