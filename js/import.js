function loadImage() {
    var fullPath = $("#imagePath").val();
    var filename = fullPath.replace(/^.*[\\\/]/, '');
    var ctx = document.getElementById('myCanvas').getContext("2d");
    var compctx = document.getElementById("myCompareCanvas").getContext("2d");
    var img = new Image();
    
    img.src = "imageDB/" + filename;
    img.onload = function(){
        ctx.canvas.height = img.height;
        ctx.canvas.width = img.width; 
        ctx.drawImage(img,0,0);
        
        $("#image-info-name").html("<b>File Name:</b> " + filename);
        $("#image-info-height").html("<b>Height:</b> " + img.height + "px");
        $("#image-info-width").html("<b>Width:</b> " + img.width + "px");
        $("#image-info").removeClass("hidden");
        
        //contrastImage(ctx, 30);
        //getColorMoment(ctx);
        //convertCanvasToGreyscale(ctx);
        //qLBP = getLBPHistogram(ctx);
        //convertCanvasToGreyscale(compctx);
        /*qLBP = new LBP();
        dbLBP = new LBP();
        
        //get image data
        var imgData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
        var qData = new Array(ctx.canvas.width);
        for (var i = 0; i < imgData.data.length; i+=4) {
            var coord = getCanvasCoordinates(i, ctx.canvas.width);
            if (!qData[coord.x]) qData[coord.x] = new Array(ctx.canvas.height);

            // change to grayscale
            var grayValue = Math.floor(imgData.data[i] * 0.3 + imgData.data[i + 1] * 0.59 + imgData.data[i + 2] * 0.11);
            imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = grayValue;

            qData[coord.x][coord.y] = grayValue;
        }
        ctx.putImageData(imgData, 0, 0);
        console.log(qLBP.distribution(qData));*/
        
        dbLBP = getLBPHistogram(compctx);
        console.log(dbLBP);
        console.log(qLBP);
        console.log(compareLBPHistograms(qLBP, dbLBP));
        //console.log(LBPHist);   
    };
}


function getColorMoment(ctx) {
    var imgData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    var px = imgData.data;
    var height = ctx.canvas.height;
    var width = ctx.canvas.width;
    var x=0, y=0;
    for(var i=0; i < px.length; i+=4) {
        var hsv = rgb2hsv(px[i],px[i+1],px[i+2]);
        
        //console.log(i + ": " + hsv);
        if(x>=width) {
            x=0;
            y++;
        }
        
        
        
        ctx.fillStyle = 'hsl(' + hsv[0] + ',' + hsv[1] + "%," + hsv[2] + "%)";
        ctx.fillRect(x,y,1,1);
        x++;
    }
    //convertCanvasToGreyscale(ctx);
}

function convertCanvasToGreyscale(ctx) {
    var imgData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    var px = imgData.data;
    
    for(var i=0; i < px.length; i+=4) {
        var red = px[i];
        var green = px[i+1];
        var blue = px[i+2];
        var alpha = px[i+3];
        
        var greyscale = red * 0.21 + green * 0.72 + blue * .07;
        
        px[i] = greyscale;
        px[i+1] = greyscale;
        px[i+2] = greyscale;
    }
    ctx.putImageData(imgData, 0, 0);
}

function getLBPHistogram(ctx) {
    var imgData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    var px = imgData.data;
    var height = ctx.canvas.height;
    var width = ctx.canvas.width;
    var x=0, y=0, featureHist = [], upNbr, downNbr, leftNbr, rightNbr, cp;
    
    //First we make sub-blocks of our image 3x3, for spacial indication.
    var cWidth = Math.floor(width/3);
    var cHeight = Math.floor(height/3);
    var cX,cY;

    for(var j=0; j<9; j++) {
        featureHist[j] = [];
        for(var i=0; i<256; i++) {
            featureHist[j][i] = 0;
        }
    }
        
        
    
    
    for(var i=0; i < px.length; i+=4) {       
        upNbr = y-1;
        downNbr = y+1;
        leftNbr = x-1;
        rightNbr = x+1;
        
        if(x>=width) {
            x=0;
            y++;
        }
        
        if(upNbr >= 0 && downNbr < height && leftNbr >= 0 && rightNbr < width) {
            cp = getCentralPixelLBP(i, px, width);
            //px[i] = histogram[j];
            //px[i+1] = histogram[j];
            //px[i+2] = histogram[j];
            if(x<cWidth) cX = 0;
            else if(x<cWidth*2) cX=1;
            else cX=2;
            
            if(y<cHeight) cY = 0;
            else if(y<cHeight*2) cY = 3;
            else cY = 6;
            var cell = cX+cY;
            featureHist[cell][cp]++;
            //console.log(x, y, cell); 
            
        }
        x++;
    }
    getPixelPercentage(featureHist, cHeight*cWidth);
    return featureHist;
}


function getCentralPixelLBP(cp, px, wdt) {
    //Central pixel and it's surrounding neighbors
    var cpVal = px[cp], nbr = [],  lbp = 0;
    var nbr = [];
    nbr[0] = px[cp-4*wdt-4];
    nbr[1] = px[cp-4*wdt];
    nbr[2] = px[cp-4*wdt+4];
    nbr[3] = px[cp+4];
    nbr[4] = px[cp+4*wdt+4];
    nbr[5] = px[cp+4*wdt];
    nbr[6] = px[cp+4*wdt-4];
    nbr[7] = px[cp-4];
    
    for(var i=0; i < nbr.length; i++) {
        if(nbr[i] >= cpVal) {
            lbp += Math.pow(2,i);
        }
    }
    return lbp;
}


function compareLBPHistograms(qHist, dbHist) {
    var distance = 0;
    var diff = 0;
    for(var i=0; i<qHist.length; i++) {
        for(var j=0; j<qHist[i].length; j++) {
            diff = qHist[i][j] - dbHist[i][j];
            diff = Math.pow(2,diff);
            diff = Math.pow(0.5,diff);
            distance += diff;
            if(diff > 0.5)
                console.log({i: i, j: j, q: qHist[i][j], db: dbHist[i][j], diff: diff, dist: distance});    
        }        
    }
    return distance;
}

//Function to get the hsv values from an rgb pixel
//Referenced from http://stackoverflow.com/a/8023734
function rgb2hsv(r,g,b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    var hue, sat;
    var val = Math.max(r,g,b);
    var diff = val - Math.min(r,g,b);
    var diffc = function(c){
        return (val - c) / 6 / diff + 1/2;
    };
    
    if(diff == 0) {
        hue = sat = 0;
    }
    else {
        sat = diff/val;
        var rc = diffc(r);
        var gc = diffc(g);
        var bc = diffc(b);
        
        if(r === val) {
            hue = bc-gc;
        }
        else if(g === val){
            hue = (1/3) + rc-bc;
        }
        else if(b === val) {
            hue = (2/3) + gc - rc;
        }
        
        if(hue < 0) {
            hue += 1;
        }
        else if(hue > 1) {
            hue -= 1;
        }
    }
    return [
        Math.round(hue * 360),
        Math.round(sat * 100),
        Math.round(val * 100)
    ];
}

//http://stackoverflow.com/a/18495093
function contrastImage(ctx, contrast) {
    var imageData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    var data = imageData.data;
    var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for(var i=0;i<data.length;i+=4)
    {
        data[i] = factor * (data[i] - 128) + 128;
        data[i+1] = factor * (data[i+1] - 128) + 128;
        data[i+2] = factor * (data[i+2] - 128) + 128;
    }
    ctx.putImageData(imageData, 0, 0);
}

function getPixelPercentage(data, totalPixels) {
    for(var i=0; i<data.length; i++) {
        for(var j=0; j<data[i].length; j++) {
            data[i][j] = parseFloat(((data[i][j] / totalPixels)*100).toFixed(10));   
        }        
    }
    
    return data;
}

function getCanvasCoordinates(n, width) {
    var x = (n / 4) % width
        , y = (n / 4 - x ) / width;
    return { x: x, y: y };
}
