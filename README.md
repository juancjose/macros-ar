# Macros AR 🇦🇷

Calculadora de macros personal, mobile-first, con **222 alimentos saludables de Argentina** (cortes de carne argentinos, pollo, cerdo, pescados, huevos, lácteos, cereales, legumbres, frutas, verduras, frutos secos, semillas, aceites), crudos y cocidos.

**👉 App: https://juancjose.github.io/macros-ar/**

- Buscá → tocá → poné los gramos → **Agregar**. Búsqueda sin acentos y tolerante a errores (“merlusa”, “entrana”).
- Porciones comunes (1 huevo grande, 1 feta, 1 taza…), selector crudo/cocido.
- Registro diario por comida (desayuno, almuerzo, merienda, cena, snacks) con hora, totales y gráfico de macros.
- Historial: calendario con colores vs. objetivo, semana, promedios de 7 días y tendencia de 30 días.
- Perfil + calculadora de objetivos (Mifflin-St Jeor), progreso de peso y medidas con gráficos y fotos locales (IndexedDB).
- Favoritos, comidas guardadas, backup JSON (exportar/importar). PWA instalable, funciona offline. Sin backend: todo queda en tu teléfono.

## Datos
Valores por 100 g de **USDA FoodData Central – SR Legacy** (cada alimento guarda su código FDC y el equivalente usado). Los cortes argentinos se mapearon al corte de EE.UU. más cercano (nalga→top round, peceto→eye of round, cuadril→tri-tip, bola de lomo→tip round, vacío→flank, entraña→skirt). La lista está en `foods.txt` y se genera con `build.py`.
