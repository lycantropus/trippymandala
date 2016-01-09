

var export_format = "PNG";
var seg_w = canvas.width/2;
var seg_h = canvas.width/2;

 context = canvas.getContext('2d');
var snap_inc = 0;
//svg
var SVG_HEAD = "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='640' style='stroke:#000000;stroke-width:1;fill:none;'>";
SVG_HEAD +=  "<rect x='0' y='0' width='640' height='640' style='fill:none;stroke:#000000;stroke-width:1;'/>";
var SVG_TAIL = "</svg>";
var SVG;

function Bzr(line_width, sx, sy, c1x, c1y, c2x, c2y, ex, ey, ox, oy, segs, flip, scale, bon, bc1y, bc1x, bc2x, bc2y) 
{
	 this.line_width=line_width; 
   this.sx=sx;
   this.sy=sy;
   this.c1x=c1x;
   this.c1y=c1y; 
   this.c2x=c2x;
   this.c2y=c2y; 
   this.ex=ex; 
   this.ey=ey; 
   this.ox=ox;
   this.oy=oy; 
   this.segs=segs; 
   this.flip=flip; 
   this.scale;
   this.brush= {bon, bc1y, bc1x, bc2x, bc2y};

	
  stage.update();


}

Bzr.prototype.get_bzr_coords = function(cw,ch,swap, brush, reflect) {
    var x_off = seg_w*this.ox;
    var y_off = seg_h*this.oy;
    var start_x = (cw*this.sx)+x_off;
    var start_y = (ch*this.sy)+y_off;

    if(!brush) 
    {
      if(!swap) 
      {
        var swap_c1x = this.c1x>0?Math.abs(swap-this.c1x):Math.abs(swap-this.c1x)*-1;
        var swap_c2x = this.c2x>0?Math.abs(swap-this.c2x):Math.abs(swap-this.c2x)*-1;
      } 
      else 
      {
        var swap_c1x = this.c1x>0?Math.abs(swap-this.c1x):swap+Math.abs(this.c1x)*1;
        var swap_c2x = this.c2x>0?Math.abs(swap-this.c2x):swap+Math.abs(this.c2x)*1;
      }
      var c1_x = (cw*swap_c1x)+x_off;
      var c1_y = (ch*(this.sy+(this.c1y*reflect)))+y_off;
      var c2_x = (cw*swap_c2x)+x_off;
      var c2_y = (ch*(this.sy+(this.c2y*reflect)))+y_off;
    } 
    else 
    {
      if(!swap) 
      {
          var swap_c1x = this.c1x>0?Math.abs(swap-(this.c1x*brush.bc1x)):Math.abs(swap-(this.c1x*brush.bc1x))*-1;
          var swap_c2x = this.c2x>0?Math.abs(swap-(this.c2x*brush.bc2x)):Math.abs(swap-(this.c2x*brush.bc2x))*-1;
      } else 
      {
          var swap_c1x = this.c1x>0?Math.abs(swap-(this.c1x*brush.bc1x)):swap+Math.abs(this.c1x*brush.bc1x)*1;
          var swap_c2x = this.c2x>0?Math.abs(swap-(this.c2x*brush.bc2x)):swap+Math.abs(this.c2x*brush.bc2x)*1;
      }
      var c1_x = (cw*swap_c1x)+x_off;
      var c1_y = (ch*(this.sy+((this.c1y*brush.bc1y)*reflect)))+y_off;
      var c2_x = (cw*swap_c2x)+x_off;
      var c2_y = (ch*(this.sy+((this.c2y*brush.bc2y)*reflect)))+y_off;
    }

    var end_x = (cw*this.ex)+x_off;
    var end_y = (ch*this.ey)+y_off;
    return [start_x, start_y, c1_x, c1_y, c2_x, c2_y, end_x, end_y];
}

Bzr.prototype.draw_mask = function(){
    SVG = "";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fill();
    context.lineWidth = 30;
    context.strokeStyle = '#000000';
    context.stroke();

    var canvas_w = canvas.width/2;
    var canvas_h = canvas.height/4;


    for(i=0; i<mandalas[0].segs; i++) 
    {

      SVG += "<g transform='translate("+(canvas.width/2)+","+(canvas.height/2)+")'>";

      SVG += "<g transform='rotate("+(((i/mandalas[0].segs)*360)-90)+")'>";
      SVG += "<g transform='scale("+mandalas[0].scale+")'>";  
      context.save();
      
      context.translate(canvas.width/2,canvas.height/2);
      context.rotate((((i/mandalas[0].segs)*360)-90)*Math.PI/180);
      context.scale(mandalas[0].scale,mandalas[0].scale);

      for(n=0;n<2;n++) 
      {
        context.beginPath();

      if(i%mandalas[0].flip) {
          var coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,0,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,0,-1)
          coords = [coords[0],coords[1],coords[4],coords[5],coords[2],coords[3],coords[6],coords[7]]
      } else {
          var coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,0,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,0,-1)
      }
    
      var svg_sx_min = coords[0];
      var svg_sy_min = coords[1];
      var svg_sx_max = coords[6];
      var svg_sy_max = coords[7];

      if(mandalas[0].brush.on) 
      {
        context.moveTo(coords[0], coords[1]);
        context.bezierCurveTo((coords[2])*1, coords[3],coords[4],coords[5],  coords[6], coords[7]);
    
        if(i%mandalas[0].flip) 
        {
          var b_coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,1,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,1,-1)
          b_coords = [b_coords[0],b_coords[1],b_coords[4],b_coords[5],b_coords[2],b_coords[3],b_coords[6],b_coords[7]];
        } 
        else 
        {
          var b_coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,1,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,1,-1)
        }
          
        context.moveTo(b_coords[6], b_coords[7]);
        context.bezierCurveTo(b_coords[4], b_coords[5], b_coords[2], b_coords[3],  b_coords[0], b_coords[1]);
        
        var svg_path =
          "<path d='m "+coords[0]+","+coords[1]+
          " c "+ (coords[2]-svg_sx_min)+","+(coords[3]-svg_sy_min)+
          " "+(coords[4]-svg_sx_min)+","+(coords[5]-svg_sy_min)+
          " "+(coords[6]-svg_sx_min)+","+(coords[7]-svg_sy_min)+
          " c "+(svg_sx_max-b_coords[4])*-1+","+(svg_sy_max-b_coords[5])*-1+
          " "+(svg_sx_max-b_coords[2])*-1+","+((svg_sy_max-b_coords[3])*-1)+
          " "+(svg_sx_max-b_coords[0])*-1+","+(svg_sy_max-b_coords[1])*-1+
          " z' fill='#ffffff' id='' />";          
      } 
      else 
      {
        context.moveTo(coords[0], coords[1]);
        context.bezierCurveTo((coords[2]), coords[3], coords[4], coords[5], coords[6], coords[7]);

        var svg_path =
          "<path d='m "+coords[0]+","+coords[1]+
          " c "+ (coords[2]-svg_sx_min)+","+(coords[3]-svg_sy_min)+
          " "+(coords[4]-svg_sx_min)+","+(coords[5]-svg_sy_min)+
          " "+(coords[6]-svg_sx_min)+","+(coords[7]-svg_sy_min)+"' id='' />";
      }
    
      SVG += svg_path;
      context.moveTo(coords[6], coords[7]);
      context.closePath();

      if(mandalas[0].brush.on) 
      {
          context.fillStyle = '#ffffff';
  
          context.fill();
      }
    
      context.lineWidth = mandalas[0].line_width;
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.stroke();

    }

    context.restore();
    SVG += "</g>";
    SVG += "</g>";
    SVG += "</g>";

  }

}



Bzr.prototype.draw =function(){
    this.draw_mask();
    context.beginPath();

    var canvas_w = canvas.width/2;
    var canvas_h = canvas.height/4;


    for(i=0; i<mandalas[0].segs; i++) 
    {

      SVG += "<g transform='translate("+(canvas.width/2)+","+(canvas.height/2)+")'>";

      SVG += "<g transform='rotate("+(((i/mandalas[0].segs)*360)-90)+")'>";
      SVG += "<g transform='scale("+mandalas[0].scale+")'>";  
      context.save();
      
      context.translate(canvas.width/2,canvas.height/2);
      context.rotate((((i/mandalas[0].segs)*360)-90)*Math.PI/180);
      context.scale(mandalas[0].scale,mandalas[0].scale);

      for(n=0;n<2;n++) 
      {
        context.beginPath();

        if(i%mandalas[0].flip) 
        {
            var coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,0,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,0,-1)
            coords = [coords[0],coords[1],coords[4],coords[5],coords[2],coords[3],coords[6],coords[7]]
        } 
        else 
        {
            var coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,0,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,0,-1)
        }
    
        var svg_sx_min = coords[0];
        var svg_sy_min = coords[1];
        var svg_sx_max = coords[6];
        var svg_sy_max = coords[7];

        if(mandalas[0].brush.on) 
        {
          context.moveTo(coords[0], coords[1]);
          context.bezierCurveTo((coords[2])*1, coords[3],coords[4],coords[5],  coords[6], coords[7]);
      
          if(i%mandalas[0].flip) 
          {
            var b_coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,1,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,1,-1)
            b_coords = [b_coords[0],b_coords[1],b_coords[4],b_coords[5],b_coords[2],b_coords[3],b_coords[6],b_coords[7]];
          } 
          else 
          {
            var b_coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,1,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,1,-1)
          }
        
          context.moveTo(b_coords[6], b_coords[7]);
          context.bezierCurveTo(b_coords[4], b_coords[5], b_coords[2], b_coords[3],  b_coords[0], b_coords[1]);
        
          var svg_path =
            "<path d='m "+coords[0]+","+coords[1]+
            " c "+ (coords[2]-svg_sx_min)+","+(coords[3]-svg_sy_min)+
            " "+(coords[4]-svg_sx_min)+","+(coords[5]-svg_sy_min)+
            " "+(coords[6]-svg_sx_min)+","+(coords[7]-svg_sy_min)+
            " c "+(svg_sx_max-b_coords[4])*-1+","+(svg_sy_max-b_coords[5])*-1+
            " "+(svg_sx_max-b_coords[2])*-1+","+((svg_sy_max-b_coords[3])*-1)+
            " "+(svg_sx_max-b_coords[0])*-1+","+(svg_sy_max-b_coords[1])*-1+
            " ' id='' />";   
        } 
        else 
        {
          context.moveTo(coords[0], coords[1]);
          context.bezierCurveTo((coords[2]), coords[3], coords[4], coords[5], coords[6], coords[7]);

          var svg_path =
            "<path d='m "+coords[0]+","+coords[1]+
            " c "+ (coords[2]-svg_sx_min)+","+(coords[3]-svg_sy_min)+
            " "+(coords[4]-svg_sx_min)+","+(coords[5]-svg_sy_min)+
            " "+(coords[6]-svg_sx_min)+","+(coords[7]-svg_sy_min)+"' id='' />";
        }
    
      SVG += svg_path;
      context.moveTo(coords[6], coords[7]);
      context.closePath();

      if(mandalas[0].brush.on) 
      {
  //        context.fillStyle = '#000000';
  //        context.fillStyle = '#ff0000';
  //        context.fill();
      }
    
      context.lineWidth = mandalas[0].line_width;
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.stroke();

    }

  context.restore();
  SVG += "</g>";
  SVG += "</g>";
  SVG += "</g>";

  }

  this.draw_contour();
}

var contour = 8;
Bzr.prototype.draw_contour=function(){
    var canvas_w = canvas.width/2;
    var canvas_h = canvas.height/4;

    for(i=0; i<mandalas[0].segs; i++) 
    {
      SVG += "<g transform='translate("+(canvas.width/2)+","+(canvas.height/2)+")'>";

      SVG += "<g transform='rotate("+(((i/mandalas[0].segs)*360)-90)+")'>";
      SVG += "<g transform='scale("+mandalas[0].scale+")'>";  
      context.save();
      
      context.translate(canvas.width/2,canvas.height/2);
      context.rotate((((i/mandalas[0].segs)*360)-90)*Math.PI/180);
      context.scale(mandalas[0].scale,mandalas[0].scale);

      for(n=0;n<2;n++) 
      {

        if(i%mandalas[0].flip) 
        {
            var coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,0,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,0,-1)
            coords = [coords[0],coords[1],coords[4],coords[5],coords[2],coords[3],coords[6],coords[7]]
        } 
        else 
        {
            var coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,0,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,0,-1)
        }
    
        var svg_sx_min = coords[0];
        var svg_sy_min = coords[1];
        var svg_sx_max = coords[6];
        var svg_sy_max = coords[7];
    
        if(i%mandalas[0].flip) 
        {
            var b_coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,1,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 1,1,-1)
            b_coords = [b_coords[0],b_coords[1],b_coords[4],b_coords[5],b_coords[2],b_coords[3],b_coords[6],b_coords[7]];
        } 
        else 
        {
            var b_coords = n%2? mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,1,1):mandalas[0].get_bzr_coords(canvas_w, canvas_h, 0,1,-1)
        }

        for(c=0;c<contour;c++ ) 
        {
          var contour_percent = c/(contour-1);
          if(contour_percent == 0 || contour_percent == 1) continue;

          context.beginPath();
      
          context.moveTo(coords[0], coords[1]);
          context.bezierCurveTo(
          coords[2]-((coords[2]-b_coords[2])*contour_percent), 
          coords[3]-((coords[3]-b_coords[3])*contour_percent),
          coords[4]-((coords[4]-b_coords[4])*contour_percent),
          coords[5]-((coords[5]-b_coords[5])*contour_percent), 
          coords[6], coords[7]);

          var svg_path =
            "<path d='m "+coords[0]+","+coords[1]+
            " c "+((coords[2]-svg_sx_min)-((coords[2]-b_coords[2])*contour_percent))+
            ","+((coords[3]-svg_sy_min)-((coords[3]-b_coords[3])*contour_percent))+
            " "+((coords[4]-svg_sx_min)-((coords[4]-b_coords[4])*contour_percent))+
            ","+((coords[5]-svg_sy_min)-((coords[5]-b_coords[5])*contour_percent))+
            " "+((coords[6]-svg_sx_min))+
            ","+((coords[7]-svg_sy_min))+
            "' id=''  style='stroke:#000000;stroke-width:"+(mandalas[0].line_width*3)+";fill:none;'  />";
        
          SVG += svg_path;
          context.moveTo(coords[6], coords[7]);
          context.closePath();

          context.lineWidth = mandalas[0].line_width*3;
          context.lineCap = 'round';
          context.strokeStyle = '#000000';
          context.stroke();
        }
      }

    context.restore();
    SVG += "</g>";
    SVG += "</g>";
    SVG += "</g>";

    }
}

function get_rand_val(scale, off) {
    var val = ((parseInt(Math.random()*1000)/1000)*scale)+off;
    return parseInt((val*100))/100;
}

Bzr.prototype.random_gen= function() {
    this.sx = get_rand_val(2, 0);
    this.ex = get_rand_val(2, 0);
    this.c1x = get_rand_val(2, -1);
    this.c1y = get_rand_val(4, -2);
    this.c2x = get_rand_val(2, -1);
    this.c2y = get_rand_val(4, -2);
    this.segs = parseInt(get_rand_val(8, 0)+6)*2;
    this.flip = parseInt(get_rand_val(2, 0)+1);
    this.line_width = parseInt(get_rand_val(6, 0)+1);


    
    if(this.brush.on) 
    {
      this.brush.bc1x = get_rand_val(1, 0.5);
      this.brush.bc1y = get_rand_val(1, 0.5);
      this.brush.bc2x = get_rand_val(1, 0.5);
      this.brush.bc2y = get_rand_val(1, 0.5);
    }
   
}



function createMandala() {
	var man1 = new Bzr(1, 0, 0, 0.25, 0.5, 0.75, -1, 1, 0, 0, 0, 8, 1, 1, 1, 1.13, 1.07, 1.18, 0.62);
  man1.random_gen(); 
  mandalas.push(man1);

}
var direction= ["DOWN","DOWN","DOWN","DOWN"];
function updateMandalas() {

	for (var i = 0; i < mandalas.length; i++)
  {
    
    //c1x
    if(direction[0] == "DOWN")
    {
      mandalas[i].c1x-=0.01;
      if(mandalas[i].c1x<=-2) direction[0]="UP";
    }

    if(direction[0] == "UP")
    {
      mandalas[i].c1x+= 0.01;
      if(mandalas[i].c1x>=2) direction[0]="DOWN";

    }

    //c1y
    if(direction[1] == "DOWN")
    {
      mandalas[i].c1y-=0.01;
      if(mandalas[i].c1y<=-2) direction[1]="UP";
    }



    if(direction[1] == "UP")
    {
      mandalas[i].c1y+= 0.01;
      if(mandalas[i].c1y>=2) direction[1]="DOWN";

    }

    //c2x
    if(direction[2] == "DOWN")
    {
      mandalas[i].c2x-=0.01;
      if(mandalas[i].c2x<=-2) direction[2]="UP";
    }

    if(direction[2] == "UP")
    {
      mandalas[i].c2x+=0.01;
      if(mandalas[i].c2x>=2) direction[2]="DOWN";
    }

    //c2y
    if(direction[3] == "DOWN")
    {
      mandalas[i].c2y-=0.01;
      if(mandalas[i].c2y<=-2) direction[3]="UP";
    }

    if(direction[3] == "UP")
    {
      mandalas[i].c2y+=0.01;
      if(mandalas[i].c2y>=2) direction[3]="DOWN";
    }
		mandalas[i].draw();

  }
}

