# Boxing Game

Un juego interactivo que utiliza la cámara del dispositivo para el gameplay.

## ¿Cómo jugar?

¡El jugador debe de manejar el menú y el juego con sus puños!

El golpe izquierdo inicia el juego, el derecho cierra el juego.

Dentro del juego el usuario debe lanzar golpes alternados para realizar combos más rápidos, el luchador rival puede bloquear máximo 3 golpes consecutivos, rompe su guardia para acabar con el, si el lanza un golpe puedes bloquearlo protegiendo tú cara con tus puños, también puedes bloquear 3 golpes, pero si bajas la guardia recuperas una unidad de bloqueo ¡aprovecha las brechas entre golpes para descansar de estar en guardia!

## Razón de desarrollo tardio
El juego no fue desarrollado a tiempo por razones de reposo debido a enfermedad :c

## Razón por implementar electron
Se implemento electron para poder ejecutar el juego de manera local sin necesidad de un servidor web. Esto debido a que el navegador no permitia el uso de la camara web de mi equipo (razón aún desconocida) en conjunto con el modelo de machine learning. Es solo otra forma de empaquetar una aplicacion web en un ejecutable. Aún es posible jugarlo exponiendo el juego a algún puerto local.

## ¿Cómo ejecutar el juego?
pre-requisitos: Tener instalado node.js y npm.

1. Clonar el repositorio.
2. Ejecutar `npm install` para instalar las dependencias.
3. Ejecutar `npm start` para iniciar el juego.