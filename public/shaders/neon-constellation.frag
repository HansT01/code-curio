precision mediump float;

#define NUM_LIGHTS 20
#define NUM_OBSTACLES 80
#define PI 3.14159265359

varying vec2 pos;
uniform vec2 u_resolution;

uniform vec2 u_lightPositions[NUM_LIGHTS];
uniform float u_lightRadii[NUM_LIGHTS];
uniform vec3 u_lightColors[NUM_LIGHTS];

uniform vec2 u_obstaclePositions[NUM_OBSTACLES];
uniform float u_obstacleRadii[NUM_OBSTACLES];

float isLit(vec2 lightPosition, vec2 obstaclePosition, float obstacleRadius, vec2 location) {
    float distanceToObstacle = distance(obstaclePosition, location);
    float distanceToLight = distance(lightPosition, location);
    vec2 lightDirection = normalize(lightPosition - location);
    vec2 obstacleDirection = normalize(obstaclePosition - location);
    float dotProduct = dot(obstacleDirection, lightDirection);
    if (distanceToObstacle < obstacleRadius) {
        return 0.0;
    }
    if (distanceToLight < distanceToObstacle || dotProduct < 0.0) {
        return 1.0;
    }
    if (distanceToObstacle * sqrt(1.0 - dotProduct * dotProduct) < obstacleRadius) {
        return 0.0;
    }
    return 1.0;
}

void main() {
    vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 coord = (pos * 2.0 - 1.0) * aspectRatio;
    vec2 positionFactor = (2.0 / u_resolution) * aspectRatio;
    float radiusFactor = (2.0 / u_resolution.y);

    vec3 color = vec3(0.0);

    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec2 lightPosition = u_lightPositions[i] * positionFactor;
        float lightRadius = u_lightRadii[i] * radiusFactor;
        vec3 lightColor = u_lightColors[i];

        float dist = distance(lightPosition, coord) - lightRadius;
        dist = clamp(dist, 0.0, 1.0);
        float intensity = 1.0 / (dist) * 0.4;

        for (int j = 0; j < NUM_OBSTACLES; j++) {
            vec2 obstaclePosition = u_obstaclePositions[j] * positionFactor;
            float obstacleRadius = u_obstacleRadii[j] * radiusFactor;
            intensity *= isLit(lightPosition, obstaclePosition, obstacleRadius, coord);
        }

        color += lightColor * intensity * lightRadius;
    }

    for (int i = 0; i < NUM_OBSTACLES; i++) {
        vec2 obstaclePosition = u_obstaclePositions[i] * positionFactor;
        float obstacleRadius = u_obstacleRadii[i] * radiusFactor;

        float dist = distance(obstaclePosition, coord);
        color += vec3(0.15) * step(0.0, obstacleRadius - dist);
        color -= vec3(0.05) * step(0.0, obstacleRadius - dist - 0.01);
    }

    gl_FragColor = vec4(color, 1.0);
}