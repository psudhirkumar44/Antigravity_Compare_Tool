/**
 * Beyond Compare Web Clone - Interactive Demo Samples
 * Pre-configured sets of text and tabular data to showcase Myers Diffing and Key-based alignment.
 */

const DemoSamples = {
    // -------------------------------------------------------------
    // TEXT SAMPLES
    // -------------------------------------------------------------
    textLeft: `/**
 * Simple Authentication Middleware
 * Version: 1.4.2
 * Author: Developer A
 */
function authenticateUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log("Debugging authHeader: " + authHeader);
    
    if (!authHeader) {
        return res.status(401).send("No Auth Header Supplied");
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid Token" });
        }
        
        req.user = decoded;
        next();
    });
}`,

    textRight: `/**
 * Premium JWT Authentication Middleware
 * Version: 2.0.0
 * Author: Security Officer & Developer A
 */
async function authenticateUser(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
    
    if (!authHeader) {
        return res.status(401).json({
            status: "fail",
            message: "Authentication token is missing. Please log in again."
        });
    }

    // Support Bearer schema
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;
    
    try {
        const decoded = await jwt.verifyAsync(token, process.env.JWT_SECRET_KEY);
        
        if (decoded.isExpired) {
            return res.status(401).json({ status: "fail", message: "Token expired" });
        }

        req.user = {
            id: decoded.sub,
            roles: decoded.roles || ['user'],
            username: decoded.username
        };
        next();
    } catch (err) {
        return res.status(403).json({ 
            status: "error",
            message: "Access forbidden: Token validation failed." 
        });
    }
}`,

    jsonLeft: `{
  "projectName": "Modest Hertz Comparator",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  },
  "config": {
    "port": 3000,
    "db_host": "localhost",
    "db_name": "modest_db"
  }
}`,

    jsonRight: `{
  "projectName": "Antigravity Beyond Compare Clone",
  "version": "1.1.0",
  "private": true,
  "dependencies": {
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.4.5",
    "bcryptjs": "^2.4.3"
  },
  "config": {
    "port": 8080,
    "db_host": "production-rds.cluster-123.us-east-1.amazonaws.com",
    "db_name": "antigravity_compare_prod"
  }
}`,

    // -------------------------------------------------------------
    // TABLE SAMPLES
    // -------------------------------------------------------------
    // Employee lists showing:
    // Left: Previous Month directory
    // Right: Current Month directory (hires, promotions, departments changes, departures)
    tableLeft: `ID,First Name,Last Name,Department,Role,Salary
101,John,Smith,Engineering,Junior Developer,65000
102,Sarah,Connor,Product,Product Manager,95000
103,James,Tiberius,Operations,SysAdmin,80000
104,Bruce,Wayne,Executive,CEO,150000
105,Clark,Kent,Marketing,Reporter,55000
106,Diana,Prince,HR,HR Director,88000
107,Peter,Parker,Marketing,Intern,30000
108,Tony,Stark,R&D,Chief Scientist,140000`,

    tableRight: `ID,First Name,Last Name,Department,Role,Salary
101,John,Smith,Engineering,Senior Developer,78000
102,Sarah,Connor,Product,VP of Product,115000
103,James,Tiberius,Operations,Cloud Architect,92000
104,Bruce,Wayne,Executive,CEO,150000
105,Clark,Kent,Marketing,Senior Reporter,68000
107,Peter,Parker,Marketing,Junior Designer,45000
108,Tony,Stark,R&D,Chief Scientist,145000
109,Barry,Allen,Operations,Courier,42000
110,Bruce,Banner,R&D,Biophysicist,120000`
};

window.DemoSamples = DemoSamples;
