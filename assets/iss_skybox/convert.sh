#!/bin/bash
 
echo "****************************"
echo "Convertir todas la imagenes JPEG y PNG a maximo 1024px de ancho en calidad 60%"
echo "****************************"
 
NUMBERJPG=`ls -1 *.{jpg,jpeg,JPG,JPEG} 2>/dev/null | wc -l`
NUMBERPNG=`ls -1 *.{png,PNG} 2>/dev/null | wc -l`
 
echo "
Se encontraron
${NUMBERJPG} imagenes jpg
${NUMBERPNG} imagenes png
en el directorio ${PWD}"
 
read -p "
Desea continuar? (y/n)" createSim
 
read -p "
Quiere reducir el tamanio a 1024px? (y/n)" reduceFotos
 
if [ "$createSim" != "y" ]
then
    echo "No se realizo ninguna conversion"
    exit 0
fi
 
if [ "$reduceFotos" != "y" ]
then
        RESIZE=-resize 1024\>
fi
 
 
    INITIALS=`du -s | cut -f1`
    COUNT=0;
    COUNTP=0;
   
   
    if (( NUMBERJPG > 0 ))
    then
        mkdir conv_from_JPEG;  
        for file in *.JPG;
            do COUNT=`expr $COUNT + 1`;
            convert $file $RESIZE -quality 60 -verbose conv_from_JPEG/$file
        done;
    JPEGW=`du -s conv_from_JPEG | cut -f1` 
    fi
   
    if (( NUMBERPNG > 0 ))
    then
        mkdir conv_from_PNG;   
        for file in *.png
            do COUNTP=`expr $COUNTP + 1`
            basename=`convert "$file" -format "%t" info:`
            convert $file $RESIZE -quality 60 -verbose conv_from_PNG/$basename.jpg
        done
    PNGW=`du -s conv_from_PNG | cut -f1`
    fi
 
 
    TOTAL=`expr $INITIALS - $PNGW`
    TOTAL=`expr $INITIALS - $JPEGW`
    TOTAL=`expr $TOTAL \/ 1024`
    INITIALS=`expr $INITIALS  \/ 1024`
    PNGW=`expr $PNGW \/ 1024`
    JPEGW=`expr $JPEGW \/ 1024`
 
    echo ""
    echo "**************************************";
    echo "El peso inicial era de $INITIALS Mb"
    echo ""
    echo "$COUNT imagenes convertidas desde JPEG";
    echo "la carpeta convert_from_JPEG pesa $JPEGW Mb"
    echo ""
    echo "$COUNTP imagenes convertidas desde PNG";
    echo "la carpeta convert_from_PNG pesa $PNGW Mb"
    echo ""
    echo "Se ahorraron $TOTAL Mb :)"
    echo "**************************************";
