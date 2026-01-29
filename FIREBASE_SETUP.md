# Configuración de Firebase

## Pasos para configurar Firebase en tu proyecto

### 1. Configurar Firestore Database

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **yo-si-canto-rico**
3. En el menú lateral, ve a **Firestore Database**
4. Si no has creado la base de datos, haz clic en **"Crear base de datos"**
5. Selecciona:
   - Modo: **Producción** (o Prueba para desarrollo)
   - Ubicación: Elige la más cercana a tu región

### 2. Configurar Reglas de Seguridad

1. En Firestore Database, ve a la pestaña **"Reglas"**
2. Copia y pega el contenido del archivo `firestore.rules` de este proyecto
3. Haz clic en **"Publicar"**

Las reglas actuales permiten lectura y escritura abierta. Para producción, deberías restringir los permisos.

### 3. Activar GitHub Pages

Tu aplicación ya está configurada para funcionar en GitHub Pages con Firebase.

1. Ve a tu repositorio: https://github.com/yalcalarico/yo-si-canto-rico
2. Ve a **Settings** → **Pages**
3. Selecciona:
   - Source: `main`
   - Folder: `/ (root)`
4. Guarda los cambios

Tu app estará disponible en: https://yalcalarico.github.io/yo-si-canto-rico/

### 4. Estructura de Datos en Firestore

#### Colección: `seasons`
```javascript
{
  name: "Temporada 1",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
  participants: ["Juan", "María", "Pedro"],
  artists: ["Artista 1", "Artista 2", "Artista 3"],
  assignments: [
    { participant: "Juan", artist: "Artista 1", participantIndex: 0 }
  ],
  videoStatus: {
    "Juan": true,
    "María": false
  }
}
```

#### Colección: `votes`
```javascript
{
  seasonId: "abc123",
  seasonName: "Temporada 1",
  voterName: "Carlos",
  ratings: {
    "Juan": 8,
    "María": 9,
    "Pedro": 7
  },
  submittedAt: "2026-01-29T...",
  updatedAt: timestamp
}
```

### 5. Archivos Modificados

- ✅ `firebase-config.js` - Configuración de Firebase
- ✅ `admin.html` - Incluye SDK de Firebase
- ✅ `voting.html` - Incluye SDK de Firebase
- ✅ `admin.js` - Usa Firestore en lugar de localStorage
- ✅ `voting.js` - Usa Firestore en lugar de localStorage

### 6. Archivos de Respaldo

Los archivos originales con localStorage se guardaron como:
- `admin-original.js`
- `voting-original.js`

## Solución de Problemas

### Error: "Firebase is not defined"
- Verifica que los scripts de Firebase se carguen antes de `firebase-config.js`
- Revisa la consola del navegador para más detalles

### Error: "Missing or insufficient permissions"
- Verifica las reglas de Firestore en Firebase Console
- Asegúrate de que las reglas permitan las operaciones necesarias

### Los datos no se guardan
- Abre la consola del navegador (F12) y busca errores
- Verifica que Firestore esté habilitado en Firebase Console
- Revisa que la configuración en `firebase-config.js` sea correcta

## Migración de Datos

Si tenías datos en localStorage, estos ya no estarán disponibles. Para migrar:

1. Abre la consola del navegador en la versión antigua
2. Ejecuta: `console.log(localStorage)`
3. Copia los datos manualmente a Firebase usando el admin panel

## Ventajas de Firebase

✅ **Datos en tiempo real** - Los cambios se sincronizan automáticamente
✅ **Acceso desde cualquier dispositivo** - Los datos están en la nube
✅ **Sin servidor** - No necesitas configurar backend
✅ **Escalable** - Soporta múltiples usuarios simultáneos
✅ **Gratis** - El plan gratuito es suficiente para uso familiar
