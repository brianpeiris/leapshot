/* global THREE, ArrayBuffer, Float32Array, Uint16Array */

window.startMeshing = function startMeshing(renderer, scene) {
  const terrainMeshes = [];
  const terrainMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
  const _getTerrainMesh = meshId => {
    let terrainMesh = terrainMeshes.find(
      terrainMesh => terrainMesh.meshId === meshId,
    );
    if (!terrainMesh) {
      terrainMesh = _makeTerrainMesh(meshId);
      terrainMeshes.push(terrainMesh);
      scene.add(terrainMesh);
    }
    return terrainMesh;
  };
  const fakeArrayBuffer = new ArrayBuffer(3 * 4);
  const fakeFloat32Array = new Float32Array(fakeArrayBuffer, 0, 3);
  const fakeUint16Array = new Uint16Array(fakeArrayBuffer, 0, 3);
  const _makeTerrainMesh = meshId => {
    const geometry = new THREE.BufferGeometry();
    const gl = renderer.getContext();
    const attributes = renderer.getAttributes();

    geometry.addAttribute(
      'position',
      new THREE.BufferAttribute(fakeFloat32Array, 3),
    );
    attributes.update(geometry.attributes.position, gl.ARRAY_BUFFER);
    geometry.addAttribute(
      'normal',
      new THREE.BufferAttribute(fakeFloat32Array, 3),
    );
    attributes.update(geometry.attributes.normal, gl.ARRAY_BUFFER);
    geometry.setIndex(new THREE.BufferAttribute(fakeUint16Array, 1));
    attributes.update(geometry.index, gl.ELEMENT_ARRAY_BUFFER);

    const material = terrainMaterial;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.meshId = meshId;
    return mesh;
  };
  const _loadTerrainMesh = (
    terrainMesh,
    {
      transformMatrix,
      positionBuffer,
      positionCount,
      normalBuffer,
      normalCount,
      indexBuffer,
      count,
    },
  ) => {
    terrainMesh.matrix.fromArray(transformMatrix);
    terrainMesh.matrixWorldNeedsUpdate = true;

    const {geometry} = terrainMesh;
    const attributes = renderer.getAttributes();

    attributes.get(geometry.attributes.position).buffer = positionBuffer;
    geometry.attributes.position.count = positionCount / 3;

    attributes.get(geometry.attributes.normal).buffer = normalBuffer;
    geometry.attributes.normal.count = normalCount / 3;

    attributes.get(geometry.index).buffer = indexBuffer;
    geometry.index.count = count / 1;
  };
  const _removeTerrainMesh = terrainMesh => {
    scene.remove(terrainMesh);
    terrainMesh.geometry.dispose();
  };
  const _onMesh = updates => {
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      const {id, type} = update;

      if (type === 'new' || type === 'update') {
        _loadTerrainMesh(_getTerrainMesh(id), update);
      } else if (type === 'unchanged') {
        // nothing
      } else {
        const index = terrainMeshes.findIndex(
          terrainMesh => terrainMesh.meshId === id,
        );
        if (index !== -1) {
          const terrainMesh = terrainMeshes[index];
          _removeTerrainMesh(terrainMesh);
          terrainMeshes.splice(index, 1);
        }
      }
    }
  };
  if (window.browser) {
    const mesher = window.browser.magicleap.RequestMeshing();
    mesher.onmesh = _onMesh;
  }
}
