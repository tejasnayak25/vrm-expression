import * as THREE from "three";
import * as THREE_VRM from "@pixiv/three-vrm";

let exp_count=1;

export default class CustomVRMExpression {
    constructor({ 
        name = null,
        vrm = null, 
        materialKeys: {
            mouth = "N00_000_00_FaceMouth_00_FACE (Instance)",
            iris = "N00_000_00_EyeIris_00_EYE (Instance)",
            highlight = "N00_000_00_EyeHighlight_00_EYE (Instance)",
            face = "N00_000_00_Face_00_SKIN (Instance)",
            eye_white = "N00_000_00_EyeWhite_00_EYE (Instance)",
            brow = "N00_000_00_FaceBrow_00_FACE (Instance)",
            eyelash = "N00_000_00_FaceEyelash_00_FACE (Instance)",
            eyeline = "N00_000_00_FaceEyeline_00_FACE (Instance)"
        } = {}, 
        overrides = {},
        additionalExpressions = []
    } = {}) { 
        this.name = name ?? `expression-${exp_count++}`;
        this.vrm = vrm;
        this.materialkeys = { mouth, iris, highlight, face, eye_white, brow, eyelash, eyeline };
        this.overrides = overrides;
        this.additionalExpressions = additionalExpressions;

        this.origMaterials = {};
        this.repMaterials = {};
        this.textureLoader = new THREE.TextureLoader();

        if (!vrm) {
            console.warn("VRMExpression: No VRM provided.");
            return;
        }

        // Find and store original materials
        vrm.scene.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                Object.entries(this.materialkeys).forEach(([key, materialName]) => {
                    if(obj.material.length) {
                        if(obj.material.find(item => item.name === materialName)) {
                            this.origMaterials[key] = obj.material;
                        }
                    } else {
                        if (obj.material.name === materialName) {
                            this.origMaterials[key] = obj.material;
                        }
                    }
                });
            }
        });

        // Replace materials asynchronously
        Object.entries(overrides).forEach(([key, texturePath]) => {
            if (!this.origMaterials[key]) {
                console.warn(`VRMExpression: Material key '${key}' not found in VRM.`);
                return;
            }

            this.textureLoader.load(texturePath, (texture) => {
                let newMaterial = new THREE_VRM.MToonMaterial();
                if(this.origMaterials[key].length) {
                    newMaterial.copy(this.origMaterials[key][0]);
                } else {
                    newMaterial.copy(this.origMaterials[key]);
                }
                texture.flipY = false;
                newMaterial.map = texture;
                newMaterial.needsUpdate = true;

                this.repMaterials[key] = newMaterial;
            });
        });

        this.value = 0;
    }

    setValue(val) {
        if (!this.vrm) return;
        
        const useOriginal = val === 0;

        this.vrm.scene.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                Object.entries(this.overrides).forEach(([key]) => {
                    if (obj.material === (useOriginal ? this.repMaterials[key] : this.origMaterials[key])) {
                        console.log(obj.material);
                        obj.material = useOriginal ? this.origMaterials[key] : this.repMaterials[key];
                    }
                });
            }
        });

        this.additionalExpressions.forEach(exp => {
            this.vrm.expressionManager.setValue(exp, val);
        });
    }
}
