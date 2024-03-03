precision mediump float;

#define NUM_LIGHTS 20
#define NUM_OBSTACLES 5
#define PI 3.14159265359

varying vec2 pos;
uniform vec2 u_resolution;

uniform vec2 u_lightPositions[NUM_LIGHTS];
uniform float u_lightRadii[NUM_LIGHTS];
uniform vec3 u_lightColors[NUM_LIGHTS];

uniform vec2 u_obstaclePositions[NUM_OBSTACLES];
uniform float u_obstacleRadii[NUM_OBSTACLES];

float isLit(vec2 lightPosition, vec2 obstaclePosition, float obstacleRadius, vec2 location) {
    float distanceToLight = distance(lightPosition, location);
    float distanceToObstacle = distance(obstaclePosition, location);

    if (distanceToObstacle < obstacleRadius) {
        return 0.0;
    }
    if (distanceToLight < distanceToObstacle) {
        return 1.0;
    }

    vec2 lightDirection = normalize(lightPosition - location);
    vec2 obstacleDirection = normalize(obstaclePosition - location);
    float dotProduct = dot(obstacleDirection, lightDirection);

    if (dotProduct < 0.0) {
        return 1.0;
    }

    float angle = acos(dotProduct);
    if (distanceToObstacle * sin(angle) < obstacleRadius) {
        return 0.0;
    }

    return 1.0;
}

void main() {
    vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 coord = (pos * 2.0 - 1.0) * aspectRatio;

    vec3 color = vec3(0.0);

    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec2 lightPosition = (2.0 / u_resolution) * u_lightPositions[i] * aspectRatio;
        float lightRadius = (2.0 / u_resolution.y) * u_lightRadii[i];
        vec3 lightColor = u_lightColors[i];

        float dist = distance(lightPosition, coord) - lightRadius;
        dist = clamp(dist, 0.0, 1.0);
        float intensity = 1.0 / (dist) * 0.4;

        for (int j = 0; j < NUM_OBSTACLES; j++) {
            vec2 obstaclePosition = (2.0 / u_resolution) * u_obstaclePositions[j] * aspectRatio;
            float obstacleRadius = (2.0 / u_resolution.y) * u_obstacleRadii[j];
            intensity *= isLit(lightPosition, obstaclePosition, obstacleRadius, coord);
        }

        color += lightColor * intensity * lightRadius;
    }

    for (int i = 0; i < NUM_OBSTACLES; i++) {
        vec2 obstaclePosition = (2.0 / u_resolution) * u_obstaclePositions[i] * aspectRatio;
        float obstacleRadius = (2.0 / u_resolution.y) * u_obstacleRadii[i];

        float dist = distance(obstaclePosition, coord) - 0.01;

        if (dist < obstacleRadius) {
            color += vec3(0.1);
        }
    }

    gl_FragColor = vec4(color, 1.0);
}