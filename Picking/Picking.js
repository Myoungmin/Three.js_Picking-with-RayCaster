import * as Three from '../three.js/three.module.js';
import { OrbitControls } from '../three.js/OrbitControls.js';

class Particle {
    constructor(scene, geometry, material, x, y) {
        const mesh = new Three.Mesh(geometry, material);
        // 넘겨받은 파라미터로 Mesh 위치 설정
        mesh.position.set(x, y, 0);
        scene.add(mesh);
        // Particle 객체에서 생성한 mesh의 wrapper 속성에 Particle 객체를 저장해둔다.
        // 마우스 커서와 교차하는 mesh를 생성한 Particle 객체에 접근하기 위한 목적
        mesh.wrapper = this;
        this.awakenTime = undefined;
        this._mesh = mesh;
    }

    // update 메서드에서 호출
    // 마우스가 큐브위에 있으면 awake 메서드가 호출된다.
    awake(time) {
        // awakenTime이 설정되지 않았다면
        if (!this.awakenTime) {
            // 넘어온 time 인자로 awakenTime 설정
            this.awakenTime = time;
        }
    }

    // Particle 객체의 상태값 변경을 위한 메서드
    update(time) {
        // awakenTime이 설정되었다면
        if (this.awakenTime) {
            // 12초 시간 설정
            const period = 12.0;
            // 현재 시간과 awakenTime이 설정된 시간의 차를 구한다.
            const t = time - this.awakenTime;
            // 시간 차가 12초를 경과하면 다시 awakenTime을 undefined로 설정
            if (t >= period) this.awakenTime = undefined;

            // 큐브를 x축으로 회전
            // lerp : Linear interpolation
            this._mesh.rotation.x = Three.MathUtils.lerp(0, Math.PI * 2 * period, t / period);

            let h_s, l;

            // 시간에 따라 선형 보간으로  h, s, l 값 변경
            if (t < period / 2) {
                h_s = Three.MathUtils.lerp(0.0, 1.0, t / (period / 2.0));
                l = Three.MathUtils.lerp(0.1, 1.0, t / (period / 2.0));
            } else {
                h_s = Three.MathUtils.lerp(1.0, 0.0, t / (period / 2.0) - 1);
                l = Three.MathUtils.lerp(1.0, 0.1, t / (period / 2.0) - 1);
            }

            // 설정한 h, s, l 값 Mesh의 color에 적용
            this._mesh.material.color.setHSL(h_s, h_s, l);

            // 설정한 h_s값을 이용하여, z값을 변경하여 돌출되는 애니메이션 효과 적용
            this._mesh.position.z = h_s * 15.0;
        }
    }
}

class App {
    constructor() {
        // id가 webgl-container인 div요소를 얻어와서, 상수에 저장 
        const divContainer = document.querySelector("#webgl-container");
        // 얻어온 상수를 클래스 필드에 정의
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._divContainer = divContainer;

        // 렌더러 생성, Three.js의 WebGLRenderer 클래스로 생성
        // antialias를 활성화 시키면 렌더링될 때 오브젝트들의 경계선이 계단 현상 없이 부드럽게 표현된다.
        const renderer = new Three.WebGLRenderer({ antialias: true });
        // window의 devicePixelRatio 속성을 얻어와 PixelRatio 설정
        // 디스플레이 설정의 배율값을 얻어온다.
        renderer.setPixelRatio(window.devicePixelRatio);
        // domElement를 자식으로 추가.
        // canvas 타입의 DOM 객체이다.
        // 문서 객체 모델(DOM, Document Object Model)은 XML이나 HTML 문서에 접근하기 위한 일종의 인터페이스.
        divContainer.appendChild(renderer.domElement);
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._renderer = renderer;

        // Scene 객체 생성
        const scene = new Three.Scene();
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._scene = scene;

        // 카메라 객체를 구성
        this._setupCamera();
        // 조명 설정
        this._setupLight();
        // 3D 모델 설정
        this._setupModel();
        // 마우스 컨트롤 설정
        this._setupControls();
        // 마우스 Picking 설정
        this._setupPicking();


        // 창 크기가 변경될 때 발생하는 이벤트인 onresize에 App 클래스의 resize 메서드를 연결한다.
        // this가 가리키는 객체가 이벤트 객체가 아닌 App클래스 객체가 되도록 하기 위해 bind로 설정한다.
        // onresize 이벤트가 필요한 이유는 렌더러와 카메라는 창 크기가 변경될 때마다 그 크기에 맞게 속성값을 재설정해줘야 한다.
        window.onresize = this.resize.bind(this);
        // onresize 이벤트와 상관없이 생성자에서 resize 메서드를 호출한다.
        // 렌더러와 카메라의 속성을 창크기에 맞게 설정해준다. 
        this.resize();

        // render 메서드를 requestAnimationFrame이라는 API에 넘겨줘서 호출해준다.
        // render 메서드 안에서 쓰이는 this가 App 클래스 객체를 가리키도록 하기 위해 bind 사용
        requestAnimationFrame(this.render.bind(this));
    }

    _setupCamera() {
        // 3D 그래픽을 출력할 영역 width, height 얻어오기
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        // 얻어온 크기를 바탕으로 Perspective 카메라 객체 생성
        const camera = new Three.PerspectiveCamera(
            75,
            width / height,
            0.1,
            100
        );
        camera.position.z = 40;
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._camera = camera;
    }

    _setupLight() {
        // 광원 색상 설정
        const color = 0xffffff;
        // 광원 세기 설정
        const intensity = 1;
        // 위 설정을 바탕으로 Directional 광원 객체 생성
        const light = new Three.DirectionalLight(color, intensity);
        // 광원 위치 설정
        light.position.set(-1, 2, 4);
        // Scene객체에 광원 추가
        this._scene.add(light);

        // AmbientLight 추가
        const ambientLight = new Three.AmbientLight(0xffffff, 1);
        this._scene.add(ambientLight);
    }

    _setupModel() {
        const geometry = new Three.BoxGeometry();

        for (let x = -20; x <= 20; x += 1.1) {
            for (let y = -20; y <= 20; y += 1.1) {
                const color = new Three.Color();
                color.setHSL(0, 0, 0.1);
                const material = new Three.MeshStandardMaterial({ color });

                // 정의한 Particle 클래스로 인스턴스 반복적으로 생성
                new Particle(this._scene, geometry, material, x, y);
            }
        }
    }

    _setupControls() {
        new OrbitControls(this._camera, this._divContainer);
    }

    _setupPicking() {
        // 카메라의 위치에서 출발해서 마우스 커서 위치 방향으로 직진하는 광선 생성
        // 이 광선과 충돌하는 Mesh를 확인할 수 있다.
        const raycaster = new Three.Raycaster();
        raycaster.cursorNormalizedPosition = undefined;
        this._divContainer.addEventListener("mousemove", this._onMouseMove.bind(this));

        this._raycaster = raycaster;
    }

    _onMouseMove(event) {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        // 마우스 위치를 -1 ~ 1 사이로 정규화 해야한다.
        const x = (event.offsetX / width) * 2 - 1;
        // y값은 마이너스로 정규화
        // 일반적인 2D 화면은 아래쪽 방향으로 증가하기 때문에 좌표를 뒤집는다.
        const y = -(event.offsetY / height) * 2 + 1;

        // 현재 마우스 좌표를 Raycaster 객체의 cursorNormalizedPosition 속성에 저장한다.
        this._raycaster.cursorNormalizedPosition = { x, y };
    }

    resize() {
        // 3D 그래픽을 출력할 영역 width, height 얻어오기
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        // 출력할 영역 width, height로 aspect 계산하여 카메라 aspect를 설정
        this._camera.aspect = width / height;
        // 변경된 aspect를 바탕으로 ProjectionMatrix 업데이트
        this._camera.updateProjectionMatrix();

        // 출력 영역 크기를 바탕으로 렌더러 크기 설정
        this._renderer.setSize(width, height);
    }

    render(time) {
        // Scene을 카메라 시점으로 렌더링하라는 코드
        this._renderer.render(this._scene, this._camera);
        // update 메서드 안에서는 time 인자를 바탕으로 애니메이션 효과 발생
        this.update(time);
        // requestAnimationFrame을 통하여 render 메서드가 반복적으로 호출될 수 있다.
        requestAnimationFrame(this.render.bind(this));
    }

    update(time) {
        // 밀리초에서 초로 변환
        time *= 0.001;

        // 마우스 위치에 있는 큐브를 얻는다.
        if (this._raycaster && this._raycaster.cursorNormalizedPosition) {
            this._raycaster.setFromCamera(this._raycaster.cursorNormalizedPosition, this._camera);
            // 광선과 교차하는 객체들을 얻는다.
            const targets = this._raycaster.intersectObjects(this._scene.children);
            // 교차하는 객체가 한 개 이상이면 가장 가까운 객체를 선택한다.
            if (targets.length > 0) {
                // 0 인덱스가 가장 가깝다.
                const mesh = targets[0].object;
                // mesh에 연결된 Particle 객체에 접근할 수 있다.
                const particle = mesh.wrapper;
                // Particle 객체의 awake 메서드를 time 인자를 전달하여 호출
                particle.awake(time);
            }
        }

        this._scene.traverse((obj3d) => {
            if (obj3d instanceof Three.Mesh) {
                obj3d.wrapper.update(time);
            }
        });
    }
}

window.onload = function () {
    new App();
}